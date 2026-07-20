import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../common/transformers/decimal.transformer';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'pending' | 'confirmed' | 'canceled' | 'completed';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'order_no', type: 'varchar', length: 30, unique: true })
  orderNo!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: OrderStatus;

  @Column({ name: 'customer_name', type: 'varchar', length: 100, nullable: true })
  customerName!: string | null;

  @Column({ name: 'contact_channel', type: 'varchar', length: 20, nullable: true })
  contactChannel!: string | null;

  @Column({ name: 'contact_value', type: 'varchar', length: 150, nullable: true })
  contactValue!: string | null;

  // Required + server-verified (see EmailVerificationService /
  // OrdersService.createOrder) on every new order - nullable at the DB
  // level only because older rows predate this field.
  @Column({ name: 'customer_email', type: 'varchar', length: 150, nullable: true })
  customerEmail!: string | null;

  // The customer's own verified LINE userId (via LIFF ID token - see
  // LineIdTokenVerifierService), NOT trusted from client input directly.
  // Lets the backend push the receipt image + remittance info straight to
  // this specific customer, separately from the fixed LINE_ADMIN_USER_ID
  // (instructor) push. Null when the order wasn't placed via LIFF/LINE.
  @Column({ name: 'customer_line_user_id', type: 'varchar', length: 50, nullable: true })
  customerLineUserId!: string | null;

  @Column({
    name: 'weight_target_kg',
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  weightTargetKg!: number | null;

  @Column({
    name: 'total_weight_kg',
    type: 'numeric',
    precision: 7,
    scale: 3,
    default: 0,
    transformer: decimalTransformer,
  })
  totalWeightKg!: number;

  // Pre-discount sum of all line items.
  @Column({
    name: 'subtotal_price_twd',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotalPriceTwd!: number;

  @Column({ name: 'discount_code', type: 'varchar', length: 30, nullable: true })
  discountCode!: string | null;

  @Column({
    name: 'discount_amount_twd',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  discountAmountTwd!: number;

  // Final amount due: subtotalPriceTwd - discountAmountTwd.
  @Column({
    name: 'total_price_twd',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalPriceTwd!: number;

  @Column({
    name: 'exchange_rate_snapshot',
    type: 'numeric',
    precision: 10,
    scale: 4,
    transformer: decimalTransformer,
  })
  exchangeRateSnapshot!: number;

  @Column({
    name: 'markup_multiplier_snapshot',
    type: 'numeric',
    precision: 6,
    scale: 3,
    transformer: decimalTransformer,
  })
  markupMultiplierSnapshot!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}