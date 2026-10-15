// Production-safe migrate (no drizzle-kit). Phase 2's `start:prod` runs this before `next start`.
import { getConfig } from "../src/lib/config.ts";
import { getDb } from "../src/lib/db/client.ts";
import { runMigrations } from "../src/lib/db/migrate.ts";

runMigrations(getDb());
console.log(`Migrations applied to ${getConfig().dbPath}`);
