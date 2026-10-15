import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../default-categories.ts";

export const TOOL_NAME = "record_transaction";

export const SYSTEM_PROMPT = `You read one image of a bank transfer slip, a bill or a receipt, in Thai or English, and report the transaction by calling the ${TOOL_NAME} tool.

Rules:
- Report only what is printed on the image. If a field is not visible, leave it out. Never guess.
- direction: "expense" when the owner paid money out (a purchase, a bill, a transfer sent). "income" when the owner received money. A transfer slip shows a sender and a receiver; the other party to the owner is the counterparty.
- amount: the total paid or received, as a plain decimal string with a dot and no thousands separators, e.g. "1234.50". For a receipt with several items, give the grand total, not an item price.
- currency: ISO 4217 code. Thai baht is THB.
- date: YYYY-MM-DD exactly as printed. Do NOT convert Buddhist Era years; if the slip prints 2569, write 2569. Thai month names map to numbers (ม.ค. = 01 ... ธ.ค. = 12).
- counterparty: the merchant, payer or payee name as printed.
- slipRef: the bank reference or transaction number, if printed.
- memo: Thai slips often have a memo field, "บันทึกช่วยจำ" (or similar wording such as "memo", "note", "ข้อความ"). If it has text, use it together with the counterparty to choose the category. The memo can change the answer: a transfer to a person with the memo "ค่าข้าว" is Food, not Transfer out. If there is no memo, decide from the counterparty alone.
- category: choose one. For expense: ${DEFAULT_EXPENSE_CATEGORIES.join(", ")}. For income: ${DEFAULT_INCOME_CATEGORIES.join(", ")}.`;

export const USER_PROMPT = "Extract the transaction from this image.";

export const TOOL_SCHEMA = {
  type: "object",
  properties: {
    direction: { type: "string", enum: ["income", "expense"] },
    amount: { type: "string", description: 'Decimal string, e.g. "1234.50"' },
    currency: { type: "string", description: "ISO 4217 code, e.g. THB" },
    date: {
      type: "string",
      description: "YYYY-MM-DD as printed (do not convert BE years)",
    },
    counterparty: { type: "string" },
    slipRef: { type: "string" },
    category: { type: "string" },
  },
} as const;
