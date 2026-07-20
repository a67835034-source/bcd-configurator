import { createHash, randomInt, randomUUID } from 'crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { EmailVerification } from '../../entities/email-verification.entity';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { buildTermsHtml } from './terms-content';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes to enter the code
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between "send code" requests per email
const MAX_ATTEMPTS = 5; // per code, before it's locked out (must request a new one)
const TOKEN_VALIDITY_MS = 2 * 60 * 60 * 1000; // how long a verified token stays usable at checkout

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

// Classic "6-digit code, entered on the same page" email verification -
// never trust a client-side "verified" flag alone: OrdersService.createOrder
// independently re-checks the resulting token (email + token + still within
// TOKEN_VALIDITY_MS of verification) before accepting an order, the same
// pattern LineIdTokenVerifierService uses for LIFF.
@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail?: string;
  private readonly paymentBankName?: string;
  private readonly paymentBankAccountName?: string;
  private readonly paymentBankAccountNumber?: string;

  constructor(
    config: ConfigService,
    @InjectRepository(EmailVerification)
    private readonly repo: Repository<EmailVerification>,
  ) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.fromEmail = config.get<string>('RESEND_FROM_EMAIL');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.paymentBankName = config.get<string>('PAYMENT_BANK_NAME');
    this.paymentBankAccountName = config.get<string>('PAYMENT_BANK_ACCOUNT_NAME');
    this.paymentBankAccountNumber = config.get<string>('PAYMENT_BANK_ACCOUNT_NUMBER');
  }

  async sendCode(email: string): Promise<void> {
    if (!this.resend || !this.fromEmail) {
      throw new BadRequestException('Email 驗證服務尚未設定完成，請聯絡管理員');
    }

    const recent = await this.repo.findOne({ where: { email }, order: { createdAt: 'DESC' } });
    if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new BadRequestException('驗證碼發送過於頻繁，請稍後再試');
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.repo.save(
      this.repo.create({
        email,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      }),
    );

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '您的驗證碼',
        html: `<p>您的驗證碼為：</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p><p>10 分鐘內有效。</p>`,
      });
    } catch (err) {
      this.logger.error('Resend send failed', err instanceof Error ? err.stack : String(err));
      throw new BadRequestException('驗證碼寄送失敗，請稍後再試');
    }
  }

  async verifyCode(email: string, code: string): Promise<string> {
    const row = await this.repo.findOne({ where: { email }, order: { createdAt: 'DESC' } });
    if (!row) {
      throw new BadRequestException('請先發送驗證碼');
    }
    if (row.verifiedAt) {
      // Already verified by an earlier call - idempotent, just hand back
      // the same token rather than erroring on a duplicate click.
      return row.verificationToken as string;
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('驗證碼已過期，請重新發送');
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('已超過驗證次數上限，請重新發送驗證碼');
    }

    if (hashCode(code) !== row.codeHash) {
      row.attempts += 1;
      await this.repo.save(row);
      throw new BadRequestException('驗證碼錯誤');
    }

    row.verifiedAt = new Date();
    row.verificationToken = randomUUID();
    await this.repo.save(row);
    return row.verificationToken;
  }

  // Called server-side from OrdersService.createOrder() - never trusts the
  // client's own claim that an email was verified.
  async isTokenValid(email: string, token: string): Promise<boolean> {
    const row = await this.repo.findOne({ where: { email, verificationToken: token } });
    if (!row || !row.verifiedAt) return false;
    return Date.now() - row.verifiedAt.getTime() < TOKEN_VALIDITY_MS;
  }

  // Fired right after an order is committed, to the same address that was
  // just verified via sendCode()/verifyCode() above - so the customer has a
  // written copy of what they ordered even if they never open the LINE
  // push (or didn't place the order through LIFF at all). Mirrors
  // LineNotifyService.notifyCustomerOrderConfirmation()'s content, but as
  // HTML. Fire-and-forget: logs and swallows failures rather than throwing,
  // same reasoning as every other post-commit notification here - a Resend
  // outage must never turn a successful order into an error response.
  async sendOrderConfirmationEmail(email: string, order: Order, items: OrderItem[]): Promise<void> {
    if (!this.resend || !this.fromEmail) {
      this.logger.warn('Skipped order confirmation email: Resend not configured.');
      return;
    }

    const twd = (n: number) => `NT$${n.toLocaleString('en-US')}`;
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const rows = items
      .map((item) => {
        const name = item.groupLabelSnapshot ? `${item.groupLabelSnapshot}-${item.optionNameSnapshot}` : item.optionNameSnapshot;
        return `<tr>
          <td style="padding:8px 4px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#132228;">${esc(name)} ×${item.quantity}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#667c83;text-align:right;white-space:nowrap;">${twd(item.lineTotalTwd)}</td>
        </tr>`;
      })
      .join('');

    const bankRows = [
      this.paymentBankName && `<div>銀行代碼：${esc(this.paymentBankName)}</div>`,
      this.paymentBankAccountNumber && `<div>銀行帳號：${esc(this.paymentBankAccountNumber)}</div>`,
      this.paymentBankAccountName && `<div>戶名：${esc(this.paymentBankAccountName)}</div>`,
    ]
      .filter(Boolean)
      .join('');

    const html = `
      <div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;color:#132228;">
        <h2 style="margin:0 0 4px;">🎉 訂單已成立</h2>
        <p style="margin:0 0 16px;font-size:13px;color:#667c83;">訂單編號：${esc(order.orderNo)}</p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
          ${rows}
        </table>

        <div style="font-size:13px;color:#667c83;display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>小計</span><span>${twd(order.subtotalPriceTwd)}</span>
        </div>
        ${
          order.discountAmountTwd > 0
            ? `<div style="font-size:13px;color:#ff6a3d;display:flex;justify-content:space-between;margin-bottom:4px;">
                <span>折扣${order.discountCode ? `（${esc(order.discountCode)}）` : ''}</span><span>-${twd(order.discountAmountTwd)}</span>
              </div>`
            : ''
        }
        <div style="font-size:18px;font-weight:bold;display:flex;justify-content:space-between;border-top:1px solid #e5e5e5;padding-top:8px;margin-top:8px;">
          <span>應付總額</span><span style="color:#ff6a3d;">${twd(order.totalPriceTwd)}</span>
        </div>

        ${
          bankRows
            ? `<div style="margin-top:20px;padding:12px;background:#f5f5f5;border-radius:6px;font-size:13px;">
                <div style="font-weight:bold;margin-bottom:6px;">🏦 匯款資訊</div>
                ${bankRows}
                <div style="margin-top:8px;color:#667c83;">轉帳完成後，請於 LINE 聊天室回覆「帳號後五碼」以便對帳。</div>
              </div>`
            : ''
        }

        ${buildTermsHtml()}
      </div>
    `;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `訂單確認 - ${order.orderNo}`,
        html,
      });
    } catch (err) {
      this.logger.error('Order confirmation email send failed', err instanceof Error ? err.stack : String(err));
    }
  }
}
