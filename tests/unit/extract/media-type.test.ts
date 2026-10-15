import { describe, expect, it } from "vitest";
import { detectMediaType } from "../../../src/lib/extract/media-type.ts";

describe("detectMediaType", () => {
  it("recognises PNG even when the file is named .jpeg", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0,
    ]);
    expect(detectMediaType(png)).toBe("image/png");
  });

  it("recognises JPEG", () => {
    expect(detectMediaType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0]))).toBe(
      "image/jpeg",
    );
  });

  it("recognises WebP", () => {
    const webp = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from("WEBP"),
    ]);
    expect(detectMediaType(webp)).toBe("image/webp");
  });

  it("returns null for anything else", () => {
    expect(detectMediaType(Buffer.from("hello world"))).toBeNull();
    expect(detectMediaType(Buffer.alloc(0))).toBeNull();
  });
});
