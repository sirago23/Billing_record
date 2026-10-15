import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { categories, fxRates, records } from "@/lib/db/schema";
import { seedCategories } from "@/lib/db/seed";
import { createTestDb } from "../helpers/test-db";

const { db, cleanup } = createTestDb();
afterAll(cleanup);

beforeEach(() => {
  db.delete(records).run();
  db.delete(categories).run();
  db.delete(fxRates).run();
});

function aRecord(categoryId: number) {
  return {
    direction: "expense" as const,
    amountMinor: 10000,
    currency: "THB",
    fxRate: "1",
    fxSource: "auto" as const,
    amountThbMinor: 10000,
    occurredAt: "2026-10-14",
    categoryId,
    source: "manual" as const,
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: "2026-10-14T00:00:00.000Z",
  };
}

describe("seedCategories", () => {
  it("creates the 13 default categories", () => {
    seedCategories(db);
    const rows = db.select().from(categories).all();
    expect(rows).toHaveLength(13);
    expect(rows.filter((r) => r.direction === "expense")).toHaveLength(9);
    expect(rows.filter((r) => r.direction === "income")).toHaveLength(4);
  });

  it("gives the same 13 when run twice", () => {
    seedCategories(db);
    seedCategories(db);
    expect(db.select().from(categories).all()).toHaveLength(13);
  });

  it("keeps the order of the default list in sort_order", () => {
    seedCategories(db);
    const food = db
      .select()
      .from(categories)
      .where(eq(categories.name, "Food"))
      .get();
    const other = db
      .select()
      .from(categories)
      .where(eq(categories.name, "Other"))
      .get();
    expect(food?.sortOrder).toBe(0);
    expect(other?.sortOrder).toBe(8);
  });
});

describe("schema", () => {
  it("stores and reads back a record linked to a category", () => {
    seedCategories(db);
    const food = db
      .select()
      .from(categories)
      .where(eq(categories.name, "Food"))
      .get()!;
    db.insert(records).values(aRecord(food.id)).run();
    const row = db.select().from(records).get();
    expect(row).toMatchObject({
      amountMinor: 10000,
      currency: "THB",
      categoryId: food.id,
    });
    expect(row?.counterparty).toBeNull();
  });

  it("rejects a record whose category does not exist", () => {
    expect(() => db.insert(records).values(aRecord(999)).run()).toThrow();
  });

  it("rejects a duplicate category name within the same direction", () => {
    db.insert(categories)
      .values({ name: "Gifts", direction: "expense", sortOrder: 0 })
      .run();
    expect(() =>
      db
        .insert(categories)
        .values({ name: "Gifts", direction: "expense", sortOrder: 1 })
        .run(),
    ).toThrow();
  });

  it("allows the same category name in the other direction", () => {
    db.insert(categories)
      .values({ name: "Gifts", direction: "expense", sortOrder: 0 })
      .run();
    db.insert(categories)
      .values({ name: "Gifts", direction: "income", sortOrder: 0 })
      .run();
    expect(db.select().from(categories).all()).toHaveLength(2);
  });

  it("caches one rate per date and currency", () => {
    db.insert(fxRates)
      .values({ date: "2026-10-14", currency: "USD", rate: "36.4521" })
      .run();
    expect(() =>
      db
        .insert(fxRates)
        .values({ date: "2026-10-14", currency: "USD", rate: "36.5" })
        .run(),
    ).toThrow();
    const row = db
      .select()
      .from(fxRates)
      .where(and(eq(fxRates.date, "2026-10-14"), eq(fxRates.currency, "USD")))
      .get();
    expect(row?.rate).toBe("36.4521");
  });

  it("has foreign keys switched on", () => {
    const row = db.get<{ foreign_keys: number }>(sql`pragma foreign_keys`);
    expect(row.foreign_keys).toBe(1);
  });
});
