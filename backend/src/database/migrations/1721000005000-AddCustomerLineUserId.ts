import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds orders.customer_line_user_id - the customer's own LINE userId,
// captured via LIFF and verified server-side (see
// LineIdTokenVerifierService) before being stored, so the backend can push
// the receipt image + remittance info directly to that customer in
// addition to the existing instructor (LINE_ADMIN_USER_ID) push.
export class AddCustomerLineUserId1721000005000 implements MigrationInterface {
  name = 'AddCustomerLineUserId1721000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders ADD COLUMN customer_line_user_id VARCHAR(50);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders DROP COLUMN customer_line_user_id;
    `);
  }
}
