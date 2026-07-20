import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { decimalTransformer } from '../common/transformers/decimal.transformer';
import { Order } from './order.entity';
import { ProductOption } from './product-option.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => ProductOption, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'option_id' })
  option!: ProductOption;

  // Denormalized on purpose (see docs/database-design.md §5): avoids a
  // group -> step join for reporting, and stays correct even if an option
  // is later reassigned to a different step.
  @Column({ name: 'step_id', type: 'int' })
  stepId!: number;

  @Column({ type: 'smallint', default: 1 })
  quantity!: number;

  @Column({
    name: 'unit_price_rmb_snapshot',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPriceRmbSnapshot!: number;

  @Column({
    name: 'unit_price_twd_snapshot',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPriceTwdSnapshot!: number;

  @Column({
    name: 'line_total_twd',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  lineTotalTwd!: number;

  @Column({ name: 'option_name_snapshot', type: 'varchar', length: 150 })
  optionNameSnapshot!: string;

  // The option's group label at order time (e.g. STA's "2mm鋁板", WING's
  // "18LBS") - null for ungrouped options (e.g. TANK BAND). Lets
  // LineNotifyService show "18LBS-黑色" instead of just "黑色", matching
  // the frontend receipt image's per-item naming.
  @Column({ name: 'group_label_snapshot', type: 'varchar', length: 100, nullable: true })
  groupLabelSnapshot!: string | null;
}