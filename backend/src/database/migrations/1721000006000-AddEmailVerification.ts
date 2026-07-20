import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds email_verifications (one row per "send code" request - see
// EmailVerification entity) and orders.customer_email, now a required field
// on new orders (contact info moved from optional to mandatory, with email
// specifically requiring server-verified proof via a 6-digit code before
// checkout can complete).
export class AddEmailVerification1721000006000 implements MigrationInterface {
  name = 'AddEmailVerification1721000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE email_verifications (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        code_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        verified_at TIMESTAMPTZ,
        verification_token VARCHAR(64),
        attempts INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`CREATE INDEX idx_email_verifications_email ON email_verifications(email);`);

    await queryRunner.query(`
      ALTER TABLE orders ADD COLUMN customer_email VARCHAR(150);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN customer_email;`);
    await queryRunner.query(`DROP TABLE email_verifications;`);
  }
}
