import { getConfig } from "../src/lib/config.ts";
import { getDb } from "../src/lib/db/client.ts";
import { seedCategories } from "../src/lib/db/seed.ts";

seedCategories(getDb());
console.log(`Default categories are in ${getConfig().dbPath}`);
