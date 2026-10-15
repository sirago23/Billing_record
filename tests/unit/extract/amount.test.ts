import { describe, expect, it } from "vitest";
import { parseExtraction } from "@/lib/extract/parse";

function amountOf(amount: unknown, currency = "THB") {
  const result = parseExtraction({ direction: "expense", amount, currency });
  return result.ok ? result.data.fields.amount : "parse failed";
}

describe("parseExtraction amount", () => {
  it("accepts a comma used as a thousands separator", () => {
    expect(amountOf("1,234.50")).toBe("1234.50");
    expect(amountOf("1,234")).toBe("1234");
    expect(amountOf("12,345,678.9")).toBe("12345678.9");
  });

  it("rejects a decimal comma instead of reading it as 100x", () => {
    expect(amountOf("12,50")).toBeNull();
    expect(amountOf("1,5")).toBeNull();
    expect(amountOf("1,23")).toBeNull();
  });

  it("allows no decimals for JPY and KRW", () => {
    expect(amountOf("1500", "JPY")).toBe("1500");
    expect(amountOf("1500.50", "JPY")).toBeNull();
    expect(amountOf("12000.5", "KRW")).toBeNull();
  });

  it("allows 3 decimals for KWD and BHD, 2 for everything else", () => {
    expect(amountOf("1.234", "KWD")).toBe("1.234");
    expect(amountOf("1.234", "BHD")).toBe("1.234");
    expect(amountOf("1.234", "THB")).toBeNull();
    expect(amountOf("1.234", "USD")).toBeNull();
  });

  it("allows at most 2 decimals when the currency is unknown", () => {
    const result = parseExtraction({ direction: "expense", amount: "1.234" });
    expect(result.ok && result.data.fields.amount).toBeNull();
  });

  it("rejects an amount too large to store safely", () => {
    expect(amountOf("99999999999999999999")).toBeNull();
    expect(amountOf("1234567890123")).toBeNull();
    expect(amountOf("123456789012")).toBe("123456789012");
  });
});
