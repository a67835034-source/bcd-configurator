# BCD Configurator — Database Design (v1)

Target engine: **PostgreSQL** (examples below use PG types/syntax; MySQL notes called
out where it differs meaningfully).

## 1. Entity overview

```
product_steps (1) ──< option_groups (1) ──< product_options
      │                                          │
      │ (direct, for steps with no groups)       │
      └──────────────────────────────────────────┘
                                                   │
system_settings (standalone, key/value)           │
                                                   │
orders (1) ──< order_items >── (N:1) product_options
```

- A **Step** (`product_steps`) is a wizard page: WING, BACKPLATE, STA, WEIGHT POCKETS, TANK BAND.
- A Step *may* have **Groups** (`option_groups`) — e.g. WING groups by tonnage
  (18/25/30lbs), BACKPLATE groups by material. TANK BAND has none, so an Option can
  attach directly to a Step.
- An **Option** (`product_options`) is a purchasable SKU — the leaf node the customer
  actually adds to their build (e.g. "w25-black / 黑色 / ¥1240").
- **`system_settings`** holds the global pricing knobs (`EXCHANGE_RATE`,
  `MARKUP_MULTIPLIER`, the LINE contact URL, etc.) as editable rows instead of
  hardcoded constants.
- **`orders`** / **`order_items`** replace the current "copy a text summary and DM the
  coach on LINE" flow with a real, queryable order record.

## 2. DBML

```dbml
Project bcd_configurator {
  database_type: 'PostgreSQL'
  note: 'BCD (Buoyancy Control Device) custom configurator: catalog, pricing settings, orders'
}

Table product_steps {
  id            bigserial     [pk]
  step_code     varchar(30)   [not null, unique, note: 'wing / backplate / sta / weight / tank']
  step_number   smallint      [not null, note: 'wizard order, was STEPS[].num']
  part_key      varchar(30)   [not null, note: 'maps to preview/asset part']
  title         varchar(100)  [not null, note: 'e.g. WING']
  subtitle      varchar(100)  [note: 'e.g. 背囊']
  description   text          [note: 'step help text']
  is_active     boolean       [not null, default: true]
  created_at    timestamptz   [not null, default: `now()`]
  updated_at    timestamptz   [not null, default: `now()`]

  indexes { step_number }
}

Table option_groups {
  id            bigserial     [pk]
  step_id       bigint        [not null, ref: > product_steps.id]
  group_code    varchar(30)   [not null, note: '18 / 25 / 30, steel / titanium, quick1kg ...']
  label         varchar(100)  [not null, note: 'e.g. 18LBS']
  spec_note     text          [note: 'material/spec text shown per group']
  display_order smallint      [not null, default: 0]
  is_active     boolean       [not null, default: true]

  indexes { (step_id, group_code) [unique] }
}

Table product_options {
  id              bigserial     [pk]
  sku_code        varchar(60)   [not null, unique, note: 'stable key, e.g. w18-black']
  step_id         bigint        [not null, ref: > product_steps.id]
  group_id        bigint        [ref: > option_groups.id, note: 'nullable - e.g. tank band has no groups']
  name            varchar(150)  [not null, note: 'e.g. 黑色, 3mm輕量化黑色鋁']
  price_rmb       decimal(10,2) [not null]
  weight_kg       decimal(6,3)  [note: 'nullable - some SKUs have unpublished weight']
  capacity_kg     decimal(6,2)  [note: 'weight-pocket capacity per pair; only used by weight step']
  hex_color       varchar(7)    [note: 'cached swatch, seeded from legacy COLOR_MAP match']
  badge_text      varchar(30)   [note: 'e.g. 熱銷, 推薦, 多人加購, 90%加購']
  image_url       text          [note: 'replaces inline base64 IMG_TB* constants']
  is_default      boolean       [not null, default: false]
  is_active       boolean       [not null, default: true]
  display_order   smallint      [not null, default: 0]
  created_at      timestamptz   [not null, default: `now()`]
  updated_at      timestamptz   [not null, default: `now()`]

  indexes {
    (step_id, group_id)
    is_active
  }
}

Table system_settings {
  id            bigserial     [pk]
  setting_key   varchar(50)   [not null, unique, note: 'EXCHANGE_RATE, MARKUP_MULTIPLIER, LINE_URL ...']
  setting_value varchar(255)  [not null]
  value_type    varchar(20)   [not null, default: 'string', note: 'number | string | url']
  description   text
  updated_by    varchar(100)
  updated_at    timestamptz   [not null, default: `now()`]
}

Table settings_audit_log {
  id            bigserial     [pk]
  setting_key   varchar(50)   [not null]
  old_value     varchar(255)
  new_value     varchar(255)  [not null]
  changed_by    varchar(100)
  changed_at    timestamptz   [not null, default: `now()`]
}

Table orders {
  id                          bigserial     [pk]
  order_no                    varchar(30)   [not null, unique, note: 'e.g. ORD-20260711-0001']
  status                      varchar(20)   [not null, default: 'pending', note: 'pending/confirmed/canceled/completed']
  customer_name                varchar(100)
  contact_channel             varchar(20)   [note: 'line / phone / email']
  contact_value                varchar(150)
  weight_target_kg            decimal(6,2)  [note: 'user-entered target for weight pocket step']
  total_weight_kg              decimal(7,3)  [not null, default: 0]
  total_price_twd              decimal(12,2) [not null, default: 0]
  exchange_rate_snapshot      decimal(10,4) [not null, note: 'EXCHANGE_RATE at time of order']
  markup_multiplier_snapshot  decimal(6,3)  [not null, note: 'MARKUP_MULTIPLIER at time of order']
  notes                        text
  created_at                   timestamptz   [not null, default: `now()`]
  updated_at                   timestamptz   [not null, default: `now()`]

  indexes {
    status
    created_at
  }
}

Table order_items {
  id                        bigserial     [pk]
  order_id                  bigint        [not null, ref: > orders.id]
  option_id                 bigint        [not null, ref: > product_options.id]
  step_id                   bigint        [not null, ref: > product_steps.id, note: 'denormalized for reporting']
  quantity                  smallint      [not null, default: 1]
  unit_price_rmb_snapshot   decimal(10,2) [not null]
  unit_price_twd_snapshot   decimal(10,2) [not null]
  line_total_twd            decimal(12,2) [not null]
  option_name_snapshot      varchar(150)  [not null, note: 'preserves name even if SKU later renamed/removed']

  indexes {
    order_id
    option_id
  }
}
```

## 3. Table purposes

### `product_steps` — the wizard pages
Replaces the top-level entries of the `STEPS` array (minus their `options`/`groups`
payload). One row per wizard step, ordered by `step_number`. `is_active` lets you
hide a whole step (e.g. discontinue TANK BAND) without deleting historical data.

### `option_groups` — sub-categories within a step
Replaces `STEPS[].groups` + `STEPS[].specNote`. Not every step needs groups (TANK BAND
has none in the source data), which is why `product_options.group_id` is nullable
rather than making this table mandatory. `spec_note` holds the per-group material/spec
description block (e.g. the 1050D/420D/TPU description text for WING's 25lbs group).

### `product_options` — the actual SKUs
Replaces `STEPS[].options[]`. This is the table the storefront reads to render swatches
and prices, and the one `order_items` points at.
- `price_rmb` is the source-of-truth cost price (matches legacy `priceRMB`); TWD is
  *derived*, never stored here — see §4.
- `weight_kg` stays nullable because several SKUs in the source data have no published
  weight (e.g. titanium backplate).
- `capacity_kg` is only meaningful for the WEIGHT POCKETS step (drives the "enter target
  kg → auto-suggest quantity" feature) — left null for everything else.
- `hex_color` caches what `colorFor()` currently computes at runtime from `COLOR_MAP`.
  Seed it once via a migration script that replays the same substring-match logic
  against `name`, then let it be an editable column going forward (some names, like
  "東北大花"/floral print, don't reduce to one clean hex and need a manual color anyway).
- `badge_text` is a plain nullable string for MVP (`熱銷`, `推薦`, `多人加購`, `90%加購`).
  If badges ever need multi-language labels or per-badge styling, promote this to a
  `badges` lookup table + join — not needed yet.
- `is_active` is a **soft delete**. Once an option has been ordered, you can't hard-delete
  it without breaking `order_items` referential integrity / order history — deactivate
  it instead so it disappears from the storefront but stays valid in past orders.

### `system_settings` — replaces the hardcoded constants block
Key/value table for `EXCHANGE_RATE`, `MARKUP_MULTIPLIER`, `LINE_URL`, and any future
global setting, so a coach/admin can update pricing from an admin UI without a code
deploy. `value_type` lets the app layer parse/validate correctly (`number` vs `string`
vs `url`). Paired with `settings_audit_log` so you can always answer "what was the
exchange rate on the day this order was placed, and who changed it."

### `orders` — the order header
This is the table that doesn't exist yet in the current static build. It captures what
today happens entirely client-side and then gets manually re-typed into a LINE chat:
customer contact info, the target configuration's totals, and **snapshots** of
`exchange_rate` and `markup_multiplier` at order time. Snapshotting is required —
without it, editing today's exchange rate in `system_settings` would silently change
the displayed total of a 6-month-old order.

### `order_items` — the order lines
One row per selected SKU (+ quantity, to support the WEIGHT POCKETS step where a
customer can order multiple units of the same pocket, e.g. 3× 2kg quick-release +
1× 1kg quick-release). Also snapshots `unit_price_rmb`, `unit_price_twd`, and
`option_name` at order time, for the same reason as above — if `product_options.name`
or `.price_rmb` changes later (renamed SKU, price update), the historical order must
still render exactly as the customer saw it at checkout.

## 4. Pricing: computed, not stored redundantly

Keep the TWD conversion (`round(price_rmb * exchange_rate * markup_multiplier)`) as
**application logic**, computed at read time for the live catalog, and **snapshotted**
only at the moment an order is placed (into `order_items.unit_price_twd_snapshot` and
`orders.total_price_twd`). Don't store a `price_twd` column on `product_options` — it
would just be a cache that goes stale every time `system_settings.EXCHANGE_RATE`
changes, and you'd have to remember to recompute every row.

## 5. Notes / open questions for the next phase

- **No `customers` table yet.** Current flow is guest checkout via LINE; `orders`
  carries `customer_name` + `contact_channel/value` directly. If you later want
  repeat-customer accounts/order history, that's a clean extraction:
  `customers (id, name, line_id, phone, email, ...)` + `orders.customer_id`.
- **MySQL note**: swap `bigserial` → `BIGINT AUTO_INCREMENT`, `timestamptz` →
  `TIMESTAMP` (or `DATETIME`), and DBML `ref:` inline syntax still generates valid
  `FOREIGN KEY` DDL either way.
- Suggest `product_options.step_id` is kept even though it's technically derivable via
  `group_id → option_groups.step_id` — it's needed directly for the ungrouped TANK BAND
  case, and denormalizing it onto `order_items` too avoids a 3-way join for reporting.
