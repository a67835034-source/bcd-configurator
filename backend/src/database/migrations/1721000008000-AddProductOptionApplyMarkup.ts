import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds product_options.apply_markup - lets specific options (the add-ons)
// be priced at cost regardless of the global MARKUP_MULTIPLIER, instead of
// every option always being subject to it. Defaults true so existing rows
// keep their current (markup-applied) pricing until explicitly opted out.
export class AddProductOptionApplyMarkup1721000008000 implements MigrationInterface {
  name = 'AddProductOptionApplyMarkup1721000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE product_options ADD COLUMN apply_markup BOOLEAN NOT NULL DEFAULT true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE product_options DROP COLUMN apply_markup;
    `);
  }
}
