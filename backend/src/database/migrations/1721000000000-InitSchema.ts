import { MigrationInterface, QueryRunner } from 'typeorm';

// Hand-written to match the entities in src/entities exactly (see
// docs/database-design.md for the schema rationale). Column types mirror
// the @Column decorators 1:1 - if you add/change a column on an entity,
// this migration will drift from it, so prefer `npm run migration:generate`
// for subsequent changes once the DB is live.
export class InitSchema1721000000000 implements MigrationInterface {
  name = 'InitSchema1721000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE product_steps (
        id SERIAL PRIMARY KEY,
        step_code VARCHAR(30) NOT NULL UNIQUE,
        step_number SMALLINT NOT NULL,
        part_key VARCHAR(30) NOT NULL,
        title VARCHAR(100) NOT NULL,
        subtitle VARCHAR(100),
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE option_groups (
        id SERIAL PRIMARY KEY,
        step_id INTEGER NOT NULL REFERENCES product_steps(id) ON DELETE CASCADE,
        group_code VARCHAR(30) NOT NULL,
        label VARCHAR(100) NOT NULL,
        spec_note TEXT,
        display_order SMALLINT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        UNIQUE (step_id, group_code)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE product_options (
        id SERIAL PRIMARY KEY,
        sku_code VARCHAR(60) NOT NULL UNIQUE,
        step_id INTEGER NOT NULL REFERENCES product_steps(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES option_groups(id) ON DELETE SET NULL,
        name VARCHAR(150) NOT NULL,
        price_rmb NUMERIC(10,2) NOT NULL,
        weight_kg NUMERIC(6,3),
        capacity_kg NUMERIC(6,2),
        hex_color VARCHAR(7),
        badge_text VARCHAR(30),
        image_url TEXT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order SMALLINT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_product_options_step_group ON product_options(step_id, group_id);
      CREATE INDEX idx_product_options_is_active ON product_options(is_active);
    `);

    await queryRunner.query(`
      CREATE TABLE system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(50) NOT NULL UNIQUE,
        setting_value VARCHAR(255) NOT NULL,
        value_type VARCHAR(20) NOT NULL DEFAULT 'string',
        description TEXT,
        updated_by VARCHAR(100),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(30) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        customer_name VARCHAR(100),
        contact_channel VARCHAR(20),
        contact_value VARCHAR(150),
        weight_target_kg NUMERIC(6,2),
        total_weight_kg NUMERIC(7,3) NOT NULL DEFAULT 0,
        total_price_twd NUMERIC(12,2) NOT NULL DEFAULT 0,
        exchange_rate_snapshot NUMERIC(10,4) NOT NULL,
        markup_multiplier_snapshot NUMERIC(6,3) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_orders_status ON orders(status);
      CREATE INDEX idx_orders_created_at ON orders(created_at);
    `);

    await queryRunner.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        option_id INTEGER NOT NULL REFERENCES product_options(id) ON DELETE RESTRICT,
        step_id INTEGER NOT NULL,
        quantity SMALLINT NOT NULL DEFAULT 1,
        unit_price_rmb_snapshot NUMERIC(10,2) NOT NULL,
        unit_price_twd_snapshot NUMERIC(10,2) NOT NULL,
        line_total_twd NUMERIC(12,2) NOT NULL,
        option_name_snapshot VARCHAR(150) NOT NULL
      );
      CREATE INDEX idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX idx_order_items_option_id ON order_items(option_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS order_items;`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders;`);
    await queryRunner.query(`DROP TABLE IF EXISTS system_settings;`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_options;`);
    await queryRunner.query(`DROP TABLE IF EXISTS option_groups;`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_steps;`);
  }
}
