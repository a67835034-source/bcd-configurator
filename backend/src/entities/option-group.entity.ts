import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductStep } from './product-step.entity';
import { ProductOption } from './product-option.entity';

@Entity('option_groups')
@Index(['step', 'groupCode'], { unique: true })
export class OptionGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ProductStep, (step) => step.groups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'step_id' })
  step!: ProductStep;

  @Column({ name: 'group_code', type: 'varchar', length: 30 })
  groupCode!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ name: 'spec_note', type: 'text', nullable: true })
  specNote!: string | null;

  // Short buyer-guidance label shown on the group's tab button, e.g. "輕便優先".
  @Column({ type: 'varchar', length: 30, nullable: true })
  tagline!: string | null;

  // One-sentence "who this is for" shown when the group is active, e.g.
  // "適合喜愛輕裝旅遊的潛水員。" - distinct from specNote, which is material/spec detail.
  @Column({ type: 'text', nullable: true })
  recommendation!: string | null;

  // Groups sharing the same parent_label collapse into a single tab in the
  // UI (e.g. STA's 3mm輕量化鋁板/3mm鋁板/2mm鋁板 all share "鋁板"), which
  // then reveals all of them together as labeled sub-sections when active.
  @Column({ name: 'parent_label', type: 'varchar', length: 30, nullable: true })
  parentLabel!: string | null;

  @Column({ name: 'display_order', type: 'smallint', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => ProductOption, (option) => option.group)
  options!: ProductOption[];
}