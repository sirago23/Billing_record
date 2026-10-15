import fs from "node:fs";
import { defineConfig } from "drizzle-kit";
import { getConfig } from "./src/lib/config.ts";

const { dataDir, dbPath } = getConfig();
// drizzle-kit opens the file but does not create its folder.
fs.mkdirSync(dataDir, { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: dbPath },
});
