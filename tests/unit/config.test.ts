import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getConfig } from "@/lib/config";

describe("getConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults the data directory to ./data", () => {
    vi.stubEnv("DATA_DIR", "");
    expect(getConfig().dataDir).toBe(path.resolve("./data"));
  });

  it("uses DATA_DIR when it is set", () => {
    vi.stubEnv("DATA_DIR", "/some/volume");
    expect(getConfig().dataDir).toBe(path.resolve("/some/volume"));
  });

  it("derives the database and uploads paths from the data directory", () => {
    vi.stubEnv("DATA_DIR", "/some/volume");
    const config = getConfig();
    expect(config.dbPath).toBe(path.join(config.dataDir, "billing.db"));
    expect(config.uploadsDir).toBe(path.join(config.dataDir, "uploads"));
  });

  it("defaults the model to claude-sonnet-5-5", () => {
    vi.stubEnv("ANTHROPIC_MODEL", "");
    expect(getConfig().anthropicModel).toBe("claude-sonnet-5-5");
  });
});
