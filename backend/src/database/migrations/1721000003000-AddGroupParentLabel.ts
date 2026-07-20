import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds option_groups.parent_label - lets several groups collapse into one
// tab in the UI (e.g. STA's "3mm輕量化鋁板" / "3mm鋁板" / "2mm鋁板" all
// share parent_label "鋁板" and render as a single "鋁板" tab that reveals
// all three specs together, instead of three separate top-level tabs).
export class AddGroupParentLabel1721000003000 implements MigrationInterface {
  name = 'AddGroupParentLabel1721000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE option_groups ADD COLUMN parent_label VARCHAR(30);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE option_groups DROP COLUMN parent_label;
    `);
  }
}
