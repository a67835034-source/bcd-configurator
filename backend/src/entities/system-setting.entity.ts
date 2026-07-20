import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'setting_key', type: 'varchar', length: 50, unique: true })
  settingKey!: string;

  @Column({ name: 'setting_value', type: 'varchar', length: 255 })
  settingValue!: string;

  @Column({ name: 'value_type', type: 'varchar', length: 20, default: 'string' })
  valueType!: 'number' | 'string' | 'url';

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy!: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}