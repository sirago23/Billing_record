// Manual only: makes one real, paid Claude call. Run with `npm run extract:sample <image>`.
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  extractFromImage,
  type ExtractImage,
} from "../src/lib/extract/extract.ts";

const MEDIA_TYPES: Record<string, ExtractImage["mediaType"]> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run extract:sample <image file>");
  process.exit(1);
}
const mediaType = MEDIA_TYPES[path.extname(file).toLowerCase()];
if (!mediaType) {
  console.error(
    "Supported here: .jpg, .jpeg, .png, .webp (HEIC is converted by the app, not this script)",
  );
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Put it in .env.");
  process.exit(1);
}

const started = Date.now();
const result = await extractFromImage({
  data: await readFile(file),
  mediaType,
});
console.log(JSON.stringify(result, null, 2));
console.log(`(${((Date.now() - started) / 1000).toFixed(1)} s)`);
process.exit(result.ok ? 0 : 1);
