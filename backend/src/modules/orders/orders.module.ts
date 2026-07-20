import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PricingModule } from '../pricing/pricing.module';
import { DiscountCodesModule } from '../discount-codes/discount-codes.module';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    PricingModule, // for CatalogPricingService.priceCart()
    DiscountCodesModule, // for DiscountCodesService
    NotificationsModule, // for LineNotifyService.notifyNewOrder() / ReceiptImageService
    EmailVerificationModule, // for EmailVerificationService.isTokenValid()
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
