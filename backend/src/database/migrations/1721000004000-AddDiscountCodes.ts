import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds the discount_codes table and the columns orders needs to record a
// code's effect (subtotal before discount, the code applied, the amount it
// took off, and total_price_twd's meaning changes from "the order total" to
// specifically "the final amount due after discount" - subtotal_price_twd
// is the new home for the pre-discount sum).
export class AddDiscountCodes1721000004000 implements MigrationInterface {
  name = 'AddDiscountCodes1721000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE discount_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(30) NOT NULL UNIQUE,
        discount_type VARCHAR(20) NOT NULL,
        discount_value NUMERIC(10,2) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        max_uses INT,
        used_count INT NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE orders ADD COLUMN subtotal_price_twd NUMERIC(12,2) NOT NULL DEFAULT 0;
      ALTER TABLE orders ADD COLUMN discount_code VARCHAR(30);
      ALTER TABLE orders ADD COLUMN discount_amount_twd NUMERIC(12,2) NOT NULL DEFAULT 0;
      UPDATE orders SET subtotal_price_twd = total_price_twd;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders DROP COLUMN subtotal_price_twd;
      ALTER TABLE orders DROP COLUMN discount_code;
      ALTER TABLE orders DROP COLUMN discount_amount_twd;
    `);
    await queryRunner.query(`DROP TABLE discount_codes;`);
  }
}
