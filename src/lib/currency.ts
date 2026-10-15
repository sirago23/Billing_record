// Digits after the decimal point in each currency's minor unit (ISO 4217).
// Anything not listed uses 2, like THB, USD and EUR.
const ZERO_DECIMAL = [
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "UYI",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
];
const THREE_DECIMAL = ["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"];

export function currencyExponent(code: string): number {
  const upper = code.toUpperCase();
  if (ZERO_DECIMAL.includes(upper)) return 0;
  if (THREE_DECIMAL.includes(upper)) return 3;
  return 2;
}
