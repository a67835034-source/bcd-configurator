import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds product_options.swatch_image_url - a cropped fabric/pattern texture
// (leopard print, floral print) shown as a small swatch chip, distinct from
// image_url which holds a full product photo shown as a large tile (e.g.
// tank band hardware). See ProductOption entity for the distinction.
export class AddSwatchImageUrl1721000001000 implements MigrationInterface {
  name = 'AddSwatchImageUrl1721000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE product_options ADD COLUMN swatch_image_url TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE product_options DROP COLUMN swatch_image_url;
    `);
  }
}
