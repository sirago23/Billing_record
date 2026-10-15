import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../default-categories.ts";

export type Direction = "income" | "expense";

export type ExtractedFields = {
  direction: Direction | null;
  amount: string | null; // decimal string in major units, e.g. "1234.50"
  currency: string | null; // ISO 4217
  date: string | null; // YYYY-MM-DD, CE
  counterparty: string | null;
  slipRef: string | null;
  category: string | null;
};

export type FieldName = keyof ExtractedFields;

export type ExtractionResult = {
  fields: ExtractedFields;
  missing: FieldName[];
  warnings: string[];
};

export type ParseOutcome =
  { ok: true; data: ExtractionResult } | { ok: false; error: string };

const FIELD_ORDER: FieldName[] = [
  "direction",
  "amount",
  "currency",
  "date",
  "counterparty",
  "slipRef",
  "category",
];

// Thai slips print Buddhist Era years (CE + 543). No real CE year is above 2400.
const BE_OFFSET = 543;
const BE_THRESHOLD = 2400;

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseDirection(value: unknown): Direction | null {
  return value === "income" || value === "expense" ? value : null;
}

function parseAmount(value: unknown): string | null {
  const raw = typeof value === "number" ? String(value) : text(value);
  if (raw === null) return null;
  const cleaned = raw.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Number(cleaned) > 0 ? cleaned : null;
}

function parseCurrency(value: unknown): string | null {
  const raw = text(value);
  if (raw === null) return null;
  const code = raw.toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

function parseDate(value: unknown, warnings: string[]): string | null {
  const raw = text(value);
  const match = raw === null ? null : /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  let year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const convertedFromBE = year > BE_THRESHOLD;
  if (convertedFromBE) year -= BE_OFFSET;

  const check = new Date(Date.UTC(year, month - 1, day));
  const valid =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  if (!valid) return null;

  if (convertedFromBE)
    warnings.push(`Buddhist Era year ${match[1]} converted to ${year} CE`);
  return `${String(year).padStart(4, "0")}-${match[2]}-${match[3]}`;
}

function parseCategory(
  value: unknown,
  direction: Direction | null,
): string | null {
  const raw = text(value);
  if (raw === null || direction === null) return null;
  const allowed: readonly string[] =
    direction === "expense"
      ? DEFAULT_EXPENSE_CATEGORIES
      : DEFAULT_INCOME_CATEGORIES;
  return (
    allowed.find((name) => name.toLowerCase() === raw.toLowerCase()) ?? null
  );
}

// Every field is optional. A field that is absent or invalid becomes null and is listed in `missing`.
export function parseExtraction(input: unknown): ParseOutcome {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "Extraction output is not an object" };
  }
  const raw = input as Record<string, unknown>;
  const warnings: string[] = [];

  const direction = parseDirection(raw.direction);
  const fields: ExtractedFields = {
    direction,
    amount: parseAmount(raw.amount),
    currency: parseCurrency(raw.currency),
    date: parseDate(raw.date, warnings),
    counterparty: text(raw.counterparty),
    slipRef: text(raw.slipRef),
    category: parseCategory(raw.category, direction),
  };
  const missing = FIELD_ORDER.filter((name) => fields[name] === null);
  return { ok: true, data: { fields, missing, warnings } };
}
