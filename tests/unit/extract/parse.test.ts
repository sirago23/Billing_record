import { describe, expect, it } from "vitest";
import { parseExtraction } from "@/lib/extract/parse";

const complete = {
  direction: "expense",
  amount: "1,234.50",
  currency: "thb",
  date: "2026-10-14",
  counterparty: "Cafe Amazon",
  slipRef: "202610140123456",
  category: "Food",
};

describe("parseExtraction", () => {
  it("accepts a complete response and normalises amount and currency", () => {
    const result = parseExtraction(complete);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fields).toEqual({
      direction: "expense",
      amount: "1234.50",
      currency: "THB",
      date: "2026-10-14",
      counterparty: "Cafe Amazon",
      slipRef: "202610140123456",
      category: "Food",
    });
    expect(result.data.missing).toEqual([]);
  });

  it("flags every field the model left out", () => {
    const result = parseExtraction({ direction: "income", amount: "500" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fields.direction).toBe("income");
    expect(result.data.fields.amount).toBe("500");
    expect(result.data.fields.currency).toBeNull();
    expect(result.data.fields.date).toBeNull();
    expect(result.data.missing).toEqual([
      "currency",
      "date",
      "counterparty",
      "slipRef",
      "category",
    ]);
  });

  it("treats null and empty strings as not found", () => {
    const result = parseExtraction({
      ...complete,
      counterparty: null,
      slipRef: "  ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fields.counterparty).toBeNull();
    expect(result.data.fields.slipRef).toBeNull();
    expect(result.data.missing).toEqual(["counterparty", "slipRef"]);
  });

  it("converts a Buddhist Era year to CE and warns", () => {
    const result = parseExtraction({ ...complete, date: "2569-10-14" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fields.date).toBe("2026-10-14");
    expect(result.data.warnings.join(" ")).toMatch(/Buddhist/);
  });

  it("keeps a CE date as it is", () => {
    const result = parseExtraction({ ...complete, date: "2024-02-29" });
    expect(result.ok && result.data.fields.date).toBe("2024-02-29");
  });

  it("flags an impossible date instead of guessing", () => {
    const result = parseExtraction({ ...complete, date: "2026-13-45" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fields.date).toBeNull();
    expect(result.data.missing).toContain("date");
  });

  it("flags a date that is not in YYYY-MM-DD form", () => {
    const result = parseExtraction({ ...complete, date: "14/10/2569" });
    expect(result.ok && result.data.fields.date).toBeNull();
  });

  it("flags an amount that is not a positive number", () => {
    for (const amount of ["abc", "-5", "0", "", "12.345"]) {
      const result = parseExtraction({ ...complete, amount });
      expect(result.ok && result.data.fields.amount, amount).toBeNull();
    }
  });

  it("accepts an amount given as a JSON number", () => {
    const result = parseExtraction({ ...complete, amount: 99.5 });
    expect(result.ok && result.data.fields.amount).toBe("99.5");
  });

  it("flags a currency that is not a 3-letter code", () => {
    const result = parseExtraction({ ...complete, currency: "baht" });
    expect(result.ok && result.data.fields.currency).toBeNull();
  });

  it("flags an unknown direction", () => {
    const result = parseExtraction({ ...complete, direction: "transfer" });
    expect(result.ok && result.data.fields.direction).toBeNull();
  });

  it("drops a category that does not belong to the direction", () => {
    const result = parseExtraction({ ...complete, category: "Salary" });
    expect(result.ok && result.data.fields.category).toBeNull();
  });

  it("drops the category when the direction is unknown", () => {
    const result = parseExtraction({ ...complete, direction: undefined });
    expect(result.ok && result.data.fields.category).toBeNull();
  });

  it("returns an error, without throwing, for malformed input", () => {
    for (const input of [null, undefined, "text", 42, [], [complete]]) {
      const result = parseExtraction(input);
      expect(result.ok, String(input)).toBe(false);
      if (!result.ok) expect(result.error).toBeTruthy();
    }
  });
});
