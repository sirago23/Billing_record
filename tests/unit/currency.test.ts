import { describe, expect, it } from "vitest";
import { currencyExponent } from "@/lib/currency";

describe("currencyExponent", () => {
  it("is 2 for THB, USD and EUR", () => {
    for (const code of ["THB", "USD", "EUR"])
      expect(currencyExponent(code)).toBe(2);
  });

  it("is 0 for JPY, KRW and VND", () => {
    for (const code of ["JPY", "KRW", "VND"])
      expect(currencyExponent(code)).toBe(0);
  });

  it("is 3 for KWD, BHD and OMR", () => {
    for (const code of ["KWD", "BHD", "OMR"])
      expect(currencyExponent(code)).toBe(3);
  });

  it("defaults to 2 for a code it does not know", () => {
    expect(currencyExponent("XYZ")).toBe(2);
  });
});
