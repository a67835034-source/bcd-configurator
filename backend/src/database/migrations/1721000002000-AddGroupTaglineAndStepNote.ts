import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds:
// - option_groups.tagline / .recommendation: short buyer-guidance copy per
//   group (e.g. WING 18LBS -> "輕便優先" / "適合喜愛輕裝旅遊的潛水員。")
// - product_steps.note: short disclaimer shown near the step title (e.g.
//   BACKPLATE -> "以下背板重量都已包含背負帶約1kg")
// - product_steps.reference_image_url / .reference_image_caption: an
//   illustrative photo shown alongside a step's option grid (e.g. the
//   harness strap included with every backplate)
export class AddGroupTaglineAndStepNote1721000002000 implements MigrationInterface {
  name = 'AddGroupTaglineAndStepNote1721000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE option_groups ADD COLUMN tagline VARCHAR(30);
      ALTER TABLE option_groups ADD COLUMN recommendation TEXT;
      ALTER TABLE product_steps ADD COLUMN note VARCHAR(200);
      ALTER TABLE product_steps ADD COLUMN reference_image_url TEXT;
      ALTER TABLE product_steps ADD COLUMN reference_image_caption VARCHAR(200);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE option_groups DROP COLUMN tagline;
      ALTER TABLE option_groups DROP COLUMN recommendation;
      ALTER TABLE product_steps DROP COLUMN note;
      ALTER TABLE product_steps DROP COLUMN reference_image_url;
      ALTER TABLE product_steps DROP COLUMN reference_image_caption;
    `);
  }
}
