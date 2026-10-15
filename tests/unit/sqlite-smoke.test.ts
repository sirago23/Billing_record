import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

describe("better-sqlite3", () => {
  it("loads the native module and runs select 1", () => {
    const db = new Database(":memory:");
    const row = db.prepare("select 1 as one").get() as { one: number };
    db.close();
    expect(row.one).toBe(1);
  });
});
