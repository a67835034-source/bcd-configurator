import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../common/transformers/decimal.transformer';
import { ProductStep } from './product-step.entity';
import { OptionGroup } from './option-group.entity';

@Entity('product_options')
export class ProductOption {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'sku_code', type: 'varchar', length: 60, unique: true })
  skuCode!: string;

  @ManyToOne(() => ProductStep, (step) => step.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step!: ProductStep;

  @ManyToOne(() => OptionGroup, (group) => group.options, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'group_id' })
  group!: OptionGroup | null;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({
    name: 'price_rmb',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  priceRmb!: number;

  @Column({
    name: 'weight_kg',
    type: 'numeric',
    precision: 6,
    scale: 3,
    nullable: true,
    transformer: decimalTransformer,
  })
  weightKg!: number | null;

  @Column({
    name: 'capacity_kg',
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  capacityKg!: number | null;

  @Column({ name: 'hex_color', type: 'varchar', length: 7, nullable: true })
  hexColor!: string | null;

  @Column({ name: 'badge_text', type: 'varchar', length: 30, nullable: true })
  badgeText!: string | null;

  // Full product photo (e.g. tank band hardware) - rendered as a large tile.
  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  // Cropped fabric/pattern texture (e.g. leopard print, floral print) -
  // rendered as a small color-chip-style swatch instead of a full photo.
  @Column({ name: 'swatch_image_url', type: 'text', nullable: true })
  swatchImageUrl!: string | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'display_order', type: 'smallint', default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}