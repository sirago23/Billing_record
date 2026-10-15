import { describe, expect, it } from "vitest";
import { extractFromImage, type ExtractClient } from "@/lib/extract/extract";

const image = { data: Buffer.from("fake"), mediaType: "image/jpeg" as const };

function clientReturning(content: unknown[]): ExtractClient {
  return {
    messages: { create: async () => ({ content }) },
  } as unknown as ExtractClient;
}

describe("extractFromImage", () => {
  it("parses the tool call from the model", async () => {
    const client = clientReturning([
      {
        type: "tool_use",
        name: "record_transaction",
        input: {
          direction: "expense",
          amount: "80",
          currency: "THB",
          date: "2026-10-01",
        },
      },
    ]);
    const result = await extractFromImage(image, {
      client,
      model: "test-model",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.fields.amount).toBe("80");
  });

  it("sends the image, the model id and a forced tool call", async () => {
    let seen: Record<string, unknown> = {};
    const client = {
      messages: {
        create: async (params: Record<string, unknown>) => {
          seen = params;
          return {
            content: [
              { type: "tool_use", name: "record_transaction", input: {} },
            ],
          };
        },
      },
    } as unknown as ExtractClient;
    await extractFromImage(image, { client, model: "test-model" });
    expect(seen.model).toBe("test-model");
    expect(seen.tool_choice).toEqual({
      type: "tool",
      name: "record_transaction",
    });
    expect(JSON.stringify(seen.messages)).toContain(
      image.data.toString("base64"),
    );
  });

  it("returns an error when the model makes no tool call", async () => {
    const client = clientReturning([
      { type: "text", text: "I cannot read this" },
    ]);
    const result = await extractFromImage(image, { client, model: "m" });
    expect(result.ok).toBe(false);
  });

  it("returns an error, without throwing, when the API call fails", async () => {
    const client = {
      messages: {
        create: async () => {
          throw new Error("network down");
        },
      },
    } as unknown as ExtractClient;
    const result = await extractFromImage(image, { client, model: "m" });
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("network down"),
    });
  });
});
