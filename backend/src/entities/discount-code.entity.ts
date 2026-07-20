import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { decimalTransformer } from '../common/transformers/decimal.transformer';

export type DiscountType = 'percentage' | 'fixed';

@Entity('discount_codes')
export class DiscountCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  code!: string;

  @Column({ name: 'discount_type', type: 'varchar', length: 20 })
  discountType!: DiscountType;

  // percentage: 0-100 (e.g. 10 = 10% off). fixed: a flat NT$ amount off.
  @Column({
    name: 'discount_value',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  discountValue!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses!: number | null;

  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount!: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
