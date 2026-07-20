import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { ProductStep } from '../entities/product-step.entity';
import { OptionGroup } from '../entities/option-group.entity';
import { ProductOption } from '../entities/product-option.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { DiscountCode } from '../entities/discount-code.entity';
import { EmailVerification } from '../entities/email-verification.entity';

dotenv.config();

// Used by the TypeORM CLI only (npm run migration:generate / migration:run),
// kept separate from the NestJS-managed connection in app.module.ts.
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [ProductStep, OptionGroup, ProductOption, SystemSetting, Order, OrderItem, DiscountCode, EmailVerification],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
