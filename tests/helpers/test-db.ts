import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { openDb, type Db } from "@/lib/db/client";

export type TestDb = { db: Db; cleanup: () => void };

// A fresh, fully migrated SQLite file in a temp directory. Call cleanup() in afterAll.
export function createTestDb(): TestDb {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "billing-test-"));
  const handle = openDb(path.join(dir, "test.db"));
  migrate(handle.db, { migrationsFolder: path.resolve("drizzle") });
  return {
    db: handle.db,
    cleanup: () => {
      handle.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
