import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OptionGroup } from './option-group.entity';
import { ProductOption } from './product-option.entity';

@Entity('product_steps')
export class ProductStep {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'step_code', type: 'varchar', length: 30, unique: true })
  stepCode!: string;

  @Column({ name: 'step_number', type: 'smallint' })
  stepNumber!: number;

  @Column({ name: 'part_key', type: 'varchar', length: 30 })
  partKey!: string;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subtitle!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // Short disclaimer shown near the title, e.g. "以下背板重量都已包含背負帶約1kg"
  // - distinct from description, which explains how to use the step.
  @Column({ type: 'varchar', length: 200, nullable: true })
  note!: string | null;

  // Illustrative photo shown alongside the option grid (e.g. the harness
  // strap that ships with every backplate), with an optional caption.
  @Column({ name: 'reference_image_url', type: 'text', nullable: true })
  referenceImageUrl!: string | null;

  @Column({ name: 'reference_image_caption', type: 'varchar', length: 200, nullable: true })
  referenceImageCaption!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => OptionGroup, (group) => group.step)
  groups!: OptionGroup[];

  @OneToMany(() => ProductOption, (option) => option.step)
  options!: ProductOption[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}