import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService as NestConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductStep } from './entities/product-step.entity';
import { OptionGroup } from './entities/option-group.entity';
import { ProductOption } from './entities/product-option.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { DiscountCode } from './entities/discount-code.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { SettingsModule } from './modules/settings/settings.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { EmailVerificationModule } from './modules/email-verification/email-verification.module';

@Module({
  imports: [
    // @nestjs/config, for reading .env (DATABASE_URL, PORT) - distinct
    // from our own SettingsModule, which serves business pricing config
    // (EXCHANGE_RATE / MARKUP_MULTIPLIER) out of the database.
    NestConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [NestConfigService],
      useFactory: (config: NestConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [ProductStep, OptionGroup, ProductOption, SystemSetting, Order, OrderItem, DiscountCode, EmailVerification],
        synchronize: false, // schema changes go through migrations, not auto-sync
      }),
    }),
    SettingsModule,
    ProductsModule,
    OrdersModule,
    EmailVerificationModule,
  ],
})
export class AppModule {}
