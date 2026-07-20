import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { ReceiptImageUrls } from './receipt-image.service';

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const MAX_ITEM_ROWS = 8; // Flex bubble body stays readable; overflow collapses to a count

/**
 * Pushes order notifications via the LINE Messaging API - to the instructor
 * (LINE_ADMIN_USER_ID, fixed) on every order, and additionally to the
 * customer's own LINE account when they placed the order through LIFF and
 * their ID token was verified (order.customerLineUserId - see
 * LineIdTokenVerifierService). This is the reliable channel - it fires
 * automatically with no action required from either party, unlike the
 * frontend LINE share link (see frontend/src/lib/lineShare.ts).
 *
 * Requires a LINE Official Account with the Messaging API enabled. Configure
 * via env: LINE_CHANNEL_ACCESS_TOKEN, LINE_ADMIN_USER_ID.
 */
@Injectable()
export class LineNotifyService {
  private readonly logger = new Logger(LineNotifyService.name);
  private readonly channelAccessToken?: string;
  private readonly adminUserId?: string;
  private readonly paymentBankName?: string;
  private readonly paymentBankAccountName?: string;
  private readonly paymentBankAccountNumber?: string;

  constructor(private readonly config: ConfigService) {
    this.channelAccessToken = this.config.get<string>('LINE_CHANNEL_ACCESS_TOKEN');
    this.adminUserId = this.config.get<string>('LINE_ADMIN_USER_ID');
    this.paymentBankName = this.config.get<string>('PAYMENT_BANK_NAME');
    this.paymentBankAccountName = this.config.get<string>('PAYMENT_BANK_ACCOUNT_NAME');
    this.paymentBankAccountNumber = this.config.get<string>('PAYMENT_BANK_ACCOUNT_NUMBER');
  }

  async notifyNewOrder(order: Order, items: OrderItem[]): Promise<void> {
    if (!this.adminUserId) {
      this.logger.warn('Skipped LINE push: LINE_ADMIN_USER_ID not configured.');
      return;
    }
    await this.pushMessages(this.adminUserId, [this.buildFlexMessage(order, items)], `admin order Flex (${order.orderNo})`);
  }

  // Fires as a separate follow-up push once the client's receipt image has
  // been captured, resized, and uploaded to R2 (see ReceiptImageService) -
  // arrives shortly after the text Flex message from notifyNewOrder(),
  // rather than being bundled into the same push, since the image doesn't
  // exist yet at order-creation time (it's captured client-side on the
  // confirmation screen, after the order - and its orderNo - already exist).
  async notifyOrderImage(order: Order, urls: ReceiptImageUrls): Promise<void> {
    if (!this.adminUserId) {
      this.logger.warn('Skipped LINE image push: LINE_ADMIN_USER_ID not configured.');
      return;
    }
    await this.pushMessages(this.adminUserId, [this.buildImageMessage(urls)], `admin receipt image (${order.orderNo})`);
  }

  // Sent right after order creation to the customer's own LINE account
  // (order.customerLineUserId, already verified server-side) - order number
  // plus fixed remittance/payment instructions, configured via
  // PAYMENT_BANK_NAME / PAYMENT_BANK_ACCOUNT_NAME / PAYMENT_BANK_ACCOUNT_NUMBER.
  //
  // Not deduped against the admin push like notifyCustomerReceiptImage() is
  // - the admin's Flex bubble never includes remittance info, so this is
  // the only place it's ever sent. Skipping it when customer == admin
  // (e.g. testing your own account) would silently drop the one message
  // that actually carries the bank details.
  async notifyCustomerOrderConfirmation(userId: string, order: Order): Promise<void> {
    const twd = (n: number) => `NT$${n.toLocaleString('en-US')}`;
    const lines = [
      '🎉 恭喜！您專屬的客製化 BCD 訂單已成立！',
      '很高興能為您準備潛水裝備！為了盡快幫您安排叫貨與組裝，請於 3 日內完成匯款。',
      '',
      '🛒 【訂單明細】',
      `訂單編號：${order.orderNo}`,
      `應付總金額：${twd(order.totalPriceTwd)}`,
      '',
      '🏦 【匯款資訊】',
    ];
    if (this.paymentBankName) lines.push(`銀行代碼：${this.paymentBankName}`);
    if (this.paymentBankAccountNumber) lines.push(`銀行帳號：${this.paymentBankAccountNumber}`);
    if (this.paymentBankAccountName) lines.push(`戶名：${this.paymentBankAccountName}`);
    if (!this.paymentBankName && !this.paymentBankAccountName && !this.paymentBankAccountNumber) {
      this.logger.warn('PAYMENT_BANK_* env vars not configured - customer confirmation sent without remittance details.');
    }
    lines.push(
      '',
      '⚠️ 【重要：匯款後請回報】',
      '轉帳完成後，請直接在這個聊天室回覆您的「帳號後五碼」。我們對帳無誤後，就會立即為您安排後續作業，並通知您預計的出貨時間！',
      '',
      '期待很快能看到您穿上專屬裝備，一起下水探索！🤿',
    );

    await this.pushMessages(userId, [{ type: 'text', text: lines.join('\n') }], `customer order confirmation (${order.orderNo})`);
  }

  // Sent to the customer once the receipt image is ready - same image the
  // instructor receives via notifyOrderImage(), pushed to a different `to`.
  async notifyCustomerReceiptImage(userId: string, urls: ReceiptImageUrls): Promise<void> {
    if (userId === this.adminUserId) {
      this.logger.log('Skipped customer receipt image: customer is the same LINE account as the admin.');
      return;
    }
    await this.pushMessages(userId, [this.buildImageMessage(urls)], 'customer receipt image');
  }

  // Diagnostic helper for OrdersController's GET /api/orders/test-line route
  // - unlike the methods above, this surfaces success/failure to the caller
  // instead of only logging, since the whole point is to let you check the
  // LINE credentials directly from a browser response.
  async sendTextMessage(text: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.channelAccessToken || !this.adminUserId) {
      return { ok: false, error: 'LINE_CHANNEL_ACCESS_TOKEN / LINE_ADMIN_USER_ID not configured in backend/.env' };
    }

    try {
      const res = await fetch(LINE_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({ to: this.adminUserId, messages: [{ type: 'text', text }] }),
      });

      if (!res.ok) {
        return { ok: false, error: `LINE API responded ${res.status}: ${await res.text()}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Shared by every push above - logs and swallows failures rather than
  // throwing, since these always fire after the thing they're reporting on
  // (an order, an uploaded image) is already committed; a LINE outage must
  // never turn a successful customer action into an error response.
  private async pushMessages(to: string, messages: unknown[], context: string): Promise<void> {
    if (!this.channelAccessToken) {
      this.logger.warn(`Skipped LINE push (${context}): LINE_CHANNEL_ACCESS_TOKEN not configured.`);
      return;
    }

    try {
      const res = await fetch(LINE_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({ to, messages }),
      });

      if (!res.ok) {
        this.logger.error(`LINE push failed (${context}, ${res.status}): ${await res.text()}`);
      }
    } catch (err) {
      this.logger.error(`LINE push threw (${context})`, err instanceof Error ? err.stack : String(err));
    }
  }

  private buildImageMessage(urls: ReceiptImageUrls) {
    return { type: 'image', originalContentUrl: urls.originalContentUrl, previewImageUrl: urls.previewImageUrl };
  }

  private buildFlexMessage(order: Order, items: OrderItem[]) {
    const twd = (n: number) => `NT$${n.toLocaleString('en-US')}`;

    const itemRows = items.slice(0, MAX_ITEM_ROWS).map((item) => {
      const itemName = item.groupLabelSnapshot ? `${item.groupLabelSnapshot}-${item.optionNameSnapshot}` : item.optionNameSnapshot;
      return {
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'text', text: `${itemName} ×${item.quantity}`, size: 'sm', color: '#132228', flex: 4, wrap: true },
          { type: 'text', text: twd(item.lineTotalTwd), size: 'sm', color: '#667c83', align: 'end', flex: 2 },
        ],
      };
    });
    const overflowCount = items.length - MAX_ITEM_ROWS;

    return {
      type: 'flex',
      altText: `新訂單 ${order.orderNo}（${twd(order.totalPriceTwd)}）`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#1c7f8c',
          paddingAll: '16px',
          contents: [
            { type: 'text', text: '🆕 新訂單通知', color: '#ffffff', weight: 'bold', size: 'md' },
            { type: 'text', text: order.orderNo, color: '#bfdde1', size: 'xs', margin: 'sm' },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '客戶', size: 'sm', color: '#667c83', flex: 2 },
                { type: 'text', text: order.customerName || '未填寫', size: 'sm', flex: 4, wrap: true },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '聯絡方式', size: 'sm', color: '#667c83', flex: 2 },
                { type: 'text', text: order.contactValue || '未填寫', size: 'sm', flex: 4, wrap: true },
              ],
            },
            { type: 'separator', margin: 'md' },
            ...itemRows,
            ...(overflowCount > 0
              ? [{ type: 'text', text: `…還有 ${overflowCount} 項`, size: 'xs', color: '#667c83' } as const]
              : []),
            { type: 'separator', margin: 'md' },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '總計', weight: 'bold', size: 'md' },
                { type: 'text', text: twd(order.totalPriceTwd), weight: 'bold', size: 'md', align: 'end', color: '#ff6a3d' },
              ],
            },
            { type: 'text', text: `裝備總重量 約 ${order.totalWeightKg}kg`, size: 'xs', color: '#667c83' },
          ],
        },
      },
    };
  }
}
