import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds order_items.group_label_snapshot - the option's group label at order
// time (e.g. "18LBS", "2mm鋁板"), so LineNotifyService's admin Flex message
// can show "18LBS-黑色" instead of just "黑色", matching the frontend
// receipt image's per-item naming (see OrderLineItem.groupLabel).
export class AddOrderItemGroupLabelSnapshot1721000007000 implements MigrationInterface {
  name = 'AddOrderItemGroupLabelSnapshot1721000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE order_items ADD COLUMN group_label_snapshot VARCHAR(100);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE order_items DROP COLUMN group_label_snapshot;
    `);
  }
}
