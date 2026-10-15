import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { Db } from "./client.ts";

// Applies the SQL files in ./drizzle. Uses drizzle-orm only, so it also works
// in a production install where drizzle-kit (a dev dependency) is absent.
export function runMigrations(db: Db): void {
  migrate(db, { migrationsFolder: path.resolve("drizzle") });
}
