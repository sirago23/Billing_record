import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../default-categories.ts";
import type { Db } from "./client.ts";
import { categories } from "./schema.ts";

// Safe to run more than once: a category that already exists is left alone.
export function seedCategories(db: Db): void {
  const defaults = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({
      name,
      direction: "expense" as const,
      sortOrder: i,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((name, i) => ({
      name,
      direction: "income" as const,
      sortOrder: i,
    })),
  ];
  db.insert(categories).values(defaults).onConflictDoNothing().run();
}
