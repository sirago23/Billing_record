import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    direction: text("direction", { enum: ["income", "expense"] }).notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (t) => [
    unique("categories_name_direction_unique").on(t.name, t.direction),
    check(
      "categories_direction_check",
      sql`${t.direction} in ('income', 'expense')`,
    ),
  ],
);

// Money is stored as integer minor units. Rates are decimal strings. No floats.
export const records = sqliteTable(
  "records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    direction: text("direction", { enum: ["income", "expense"] }).notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    fxRate: text("fx_rate").notNull(),
    fxSource: text("fx_source", { enum: ["auto", "manual"] }).notNull(),
    amountThbMinor: integer("amount_thb_minor").notNull(),
    occurredAt: text("occurred_at").notNull(),
    counterparty: text("counterparty"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    note: text("note"),
    slipRef: text("slip_ref"),
    imagePath: text("image_path"),
    source: text("source", { enum: ["ai", "manual"] }).notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    check("records_amount_check", sql`${t.amountMinor} > 0`),
    // A tiny foreign amount can round to 0 satang, so 0 is allowed here.
    check("records_amount_thb_check", sql`${t.amountThbMinor} >= 0`),
    check("records_currency_check", sql`length(${t.currency}) = 3`),
    check(
      "records_direction_check",
      sql`${t.direction} in ('income', 'expense')`,
    ),
    check("records_fx_source_check", sql`${t.fxSource} in ('auto', 'manual')`),
    check("records_source_check", sql`${t.source} in ('ai', 'manual')`),
    index("records_occurred_at_idx").on(t.occurredAt),
    index("records_category_id_idx").on(t.categoryId),
    // Duplicate warning: same slip reference, date and amount.
    index("records_duplicate_check_idx").on(
      t.slipRef,
      t.occurredAt,
      t.amountMinor,
    ),
  ],
);

export const fxRates = sqliteTable(
  "fx_rates",
  {
    date: text("date").notNull(),
    currency: text("currency").notNull(),
    rate: text("rate").notNull(),
  },
  (t) => [primaryKey({ columns: [t.date, t.currency] })],
);

export type RecordRow = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
