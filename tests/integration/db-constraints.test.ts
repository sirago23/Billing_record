import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { categories } from "@/lib/db/schema";
import { createTestDb } from "../helpers/test-db";

const { db, cleanup } = createTestDb();
afterAll(cleanup);

beforeAll(() => {
  db.insert(categories)
    .values({ name: "Food", direction: "expense", sortOrder: 0 })
    .run();
});

// Raw SQL on purpose: TypeScript would stop most of these before they reach the database.
function insertRecord(
  overrides: Partial<{
    direction: string;
    amountMinor: number;
    currency: string;
    amountThbMinor: number;
    fxSource: string;
    source: string;
  }> = {},
) {
  const r = {
    direction: "expense",
    amountMinor: 10000,
    currency: "THB",
    amountThbMinor: 10000,
    fxSource: "auto",
    source: "manual",
    ...overrides,
  };
  db.run(sql`
    insert into records (direction, amount_minor, currency, fx_rate, fx_source,
      amount_thb_minor, occurred_at, category_id, source, created_at, updated_at)
    values (${r.direction}, ${r.amountMinor}, ${r.currency}, '1', ${r.fxSource},
      ${r.amountThbMinor}, '2026-10-14', 1, ${r.source}, 'now', 'now')
  `);
}

describe("records constraints", () => {
  it("accepts a valid record", () => {
    expect(() => insertRecord()).not.toThrow();
  });

  it("rejects a zero or negative amount", () => {
    expect(() => insertRecord({ amountMinor: 0 })).toThrow();
    expect(() => insertRecord({ amountMinor: -5 })).toThrow();
  });

  it("rejects a negative THB amount but allows 0 for a tiny foreign amount", () => {
    expect(() => insertRecord({ amountThbMinor: -1 })).toThrow();
    expect(() => insertRecord({ amountThbMinor: 0 })).not.toThrow();
  });

  it("rejects a currency that is not 3 letters", () => {
    expect(() => insertRecord({ currency: "BT" })).toThrow();
    expect(() => insertRecord({ currency: "baht" })).toThrow();
  });

  it("rejects an unknown direction, fx source or record source", () => {
    expect(() => insertRecord({ direction: "transfer" })).toThrow();
    expect(() => insertRecord({ fxSource: "guess" })).toThrow();
    expect(() => insertRecord({ source: "robot" })).toThrow();
  });
});

describe("categories constraints", () => {
  it("rejects an unknown direction", () => {
    expect(() =>
      db.run(
        sql`insert into categories (name, direction, sort_order) values ('X', 'sideways', 0)`,
      ),
    ).toThrow();
  });
});

describe("indexes", () => {
  it("has indexes for the date, category and duplicate-check lookups", () => {
    const rows = db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'index' and tbl_name = 'records'`,
    );
    const names = rows.map((r) => r.name);
    expect(names).toContain("records_occurred_at_idx");
    expect(names).toContain("records_category_id_idx");
    expect(names).toContain("records_duplicate_check_idx");
  });
});
