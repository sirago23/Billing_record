import {
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
  (t) => [unique("categories_name_direction_unique").on(t.name, t.direction)],
);

// Money is stored as integer minor units. Rates are decimal strings. No floats.
export const records = sqliteTable("records", {
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
});

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
