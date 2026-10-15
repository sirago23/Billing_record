import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { openDb, type Db } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";

export type TestDb = { db: Db; cleanup: () => void };

// A fresh, fully migrated SQLite file in a temp directory. Call cleanup() in afterAll.
export function createTestDb(): TestDb {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "billing-test-"));
  const handle = openDb(path.join(dir, "test.db"));
  runMigrations(handle.db);
  return {
    db: handle.db,
    cleanup: () => {
      handle.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
