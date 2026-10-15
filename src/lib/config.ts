import path from "node:path";

const DEFAULT_MODEL = "claude-sonnet-5-5";

export type Config = {
  dataDir: string;
  dbPath: string;
  uploadsDir: string;
  anthropicModel: string;
};

// Read on every call so tests can change the environment between cases.
export function getConfig(): Config {
  const dataDir = path.resolve(process.env.DATA_DIR || "./data");
  return {
    dataDir,
    dbPath: path.join(dataDir, "billing.db"),
    uploadsDir: path.join(dataDir, "uploads"),
    anthropicModel: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
  };
}
