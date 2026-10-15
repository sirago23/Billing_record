import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { getConfig } from "../config.ts";
import * as schema from "./schema.ts";

export type Db = BetterSQLite3Database<typeof schema>;

export type DbHandle = { db: Db; close: () => void };

// Server only. Creates the directory and the file if they do not exist.
export function openDb(file: string): DbHandle {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return { db: drizzle(sqlite, { schema }), close: () => sqlite.close() };
}

// One connection per server process, at DATA_DIR/billing.db. It is kept on
// globalThis because Next dev reloads modules, which would otherwise open a
// new handle on every reload.
const globalForDb = globalThis as typeof globalThis & {
  billingDb?: DbHandle;
};

export function getDb(): Db {
  globalForDb.billingDb ??= openDb(getConfig().dbPath);
  return globalForDb.billingDb.db;
}
