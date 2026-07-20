import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LineNotifyService } from '../notifications/line-notify.service';
import { ReceiptImageService } from '../notifications/receipt-image.service';
import { LineIdTokenVerifierService } from '../notifications/line-id-token-verifier.service';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { CatalogPricingService } from '../pricing/catalog-pricing.service';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { DiscountCode } from '../../entities/discount-code.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

const ALLOWED_RECEIPT_MIME_TYPES = ['image/png', 'image/jpeg'];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly catalogPricingService: CatalogPricingService,
    private readonly discountCodesService: DiscountCodesService,
    private readonly lineNotifyService: LineNotifyService,
    private readonly receiptImageService: ReceiptImageService,
    private readonly lineIdTokenVerifierService: LineIdTokenVerifierService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<OrderResponseDto> {
    // Contact info is now required (see CreateOrderDto) and email
    // specifically requires server-verified proof - a client claiming
    // "verified: true" isn't enough, the token has to actually check out
    // against the row EmailVerificationService created when the code was
    // confirmed.
    const emailVerified = await this.emailVerificationService.isTokenValid(dto.customerEmail, dto.emailVerificationToken);
    if (!emailVerified) {
      throw new BadRequestException('Email 尚未驗證或驗證已過期，請重新驗證信箱');
    }

    // Re-fetches + re-prices every option server-side - the request body is
    // never trusted for name/price, only for "which SKU + how many".
    const pricedCart = await this.catalogPricingService.priceCart(dto.items);
    const { items: pricedItems, subtotalTwd, totalWeightKg, exchangeRate, markupMultiplier } = pricedCart;

    // Verified (not just decoded) before the transaction, same reasoning as
    // pricing above: never trust client input for anything that drives a
    // side-effect - here, which LINE account receives remittance info and
    // the receipt image.
    const customerLineUserId = dto.liffIdToken ? await this.lineIdTokenVerifierService.verify(dto.liffIdToken) : null;
    if (!dto.liffIdToken) {
      this.logger.log('No liffIdToken on this order (not opened via LIFF, or initLiff() never resolved a token) - no customer-facing LINE push will be sent.');
    } else if (!customerLineUserId) {
      this.logger.warn('liffIdToken present but verification failed - see LineIdTokenVerifierService logs above for why. No customer-facing LINE push will be sent.');
    } else {
      this.logger.log(`Customer LINE userId verified for this order (${customerLineUserId.slice(0, 8)}...).`);
    }

    const { order: savedOrder, items: savedItems } = await this.dataSource.transaction(async (manager) => {
      // Re-validate the code inside the transaction (not just trusting an
      // earlier /validate call) so a code that expired or hit its usage cap
      // in the meantime can't slip through, and the usage increment below
      // sees a consistent view of the row.
      let discountCode: DiscountCode | null = null;
      let discountAmountTwd = 0;
      if (dto.discountCode) {
        discountCode = await this.discountCodesService.findValidCode(dto.discountCode, manager);
        discountAmountTwd = this.discountCodesService.computeDiscountAmount(discountCode, subtotalTwd);
      }
      const totalPriceTwd = subtotalTwd - discountAmountTwd;

      const order = manager.create(Order, {
        orderNo: this.generateOrderNo(),
        status: 'pending',
        customerName: dto.customerName,
        contactChannel: dto.contactChannel,
        contactValue: dto.contactValue,
        customerEmail: dto.customerEmail,
        customerLineUserId,
        weightTargetKg: dto.weightTargetKg ?? null,
        totalWeightKg: Number(totalWeightKg.toFixed(3)),
        subtotalPriceTwd: subtotalTwd,
        discountCode: discountCode?.code ?? null,
        discountAmountTwd,
        totalPriceTwd,
        exchangeRateSnapshot: exchangeRate,
        markupMultiplierSnapshot: markupMultiplier,
        notes: dto.notes,
      });
      const persistedOrder = await manager.save(order);

      const orderItems = pricedItems.map((item) =>
        manager.create(OrderItem, {
          order: persistedOrder,
          option: item.option,
          stepId: item.option.step.id,
          quantity: item.quantity,
          unitPriceRmbSnapshot: item.unitPriceRmb,
          unitPriceTwdSnapshot: item.unitPriceTwd,
          lineTotalTwd: item.lineTotalTwd,
          optionNameSnapshot: item.option.name,
          groupLabelSnapshot: item.option.group?.label ?? null,
        }),
      );
      const persistedItems = await manager.save(OrderItem, orderItems);

      if (discountCode) {
        await this.discountCodesService.incrementUsage(discountCode.id, manager);
      }

      return { order: persistedOrder, items: persistedItems };
    });

    // Fire-and-forget from the caller's perspective: neither call below
    // throws (they log internally) and the order is already committed, so a
    // LINE/network failure here must never turn a successful order into a
    // 500 response.
    await this.lineNotifyService.notifyNewOrder(savedOrder, savedItems);
    if (customerLineUserId) {
      await this.lineNotifyService.notifyCustomerOrderConfirmation(customerLineUserId, savedOrder);
    }
    await this.emailVerificationService.sendOrderConfirmationEmail(dto.customerEmail, savedOrder, savedItems);

    return {
      orderId: savedOrder.id,
      orderNo: savedOrder.orderNo,
      status: savedOrder.status,
      subtotalPriceTwd: savedOrder.subtotalPriceTwd,
      discountCode: savedOrder.discountCode ?? undefined,
      discountAmountTwd: savedOrder.discountAmountTwd,
      totalPriceTwd: savedOrder.totalPriceTwd,
      totalWeightKg: savedOrder.totalWeightKg,
      itemCount: pricedItems.length,
    };
  }

  // Called separately from createOrder() - the receipt image is captured
  // client-side on the confirmation screen (needs the real orderNo to
  // render, which doesn't exist until createOrder() has already returned),
  // so it arrives as its own follow-up request rather than in the same
  // multipart body as the order payload.
  async attachReceiptImage(orderId: number, buffer: Buffer, mimetype: string): Promise<void> {
    if (!ALLOWED_RECEIPT_MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException('receiptImage must be a PNG or JPEG image');
    }

    const order = await this.dataSource.getRepository(Order).findOneBy({ id: orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Fire-and-forget from the caller's perspective, same pattern as
    // notifyNewOrder: this is a best-effort notification side-effect on an
    // already-completed order, so upload/push failures are logged inside
    // these services and must never surface as an error response here.
    const urls = await this.receiptImageService.processAndUpload(order.orderNo, buffer);
    if (urls) {
      await this.lineNotifyService.notifyOrderImage(order, urls);
      if (order.customerLineUserId) {
        await this.lineNotifyService.notifyCustomerReceiptImage(order.customerLineUserId, urls);
      }
    }
  }

  private generateOrderNo(): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = randomUUID().split('-')[0].toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }
}
