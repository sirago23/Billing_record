import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import {
  createClient,
  extractFromImage,
  type ExtractClient,
} from "@/lib/extract/extract";

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
    expect(result.ok).toBe(false);
  });

  it("does not pass the raw API error text on to the caller", async () => {
    const client = {
      messages: {
        create: async () => {
          throw new Error("req_abc123 body: secret detail");
        },
      },
    } as unknown as ExtractClient;
    const result = await extractFromImage(image, { client, model: "m" });
    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(JSON.stringify(result)).not.toMatch(/req_abc123|secret detail/);
  });

  it("gives a short specific message for auth, rate limit and timeout errors", async () => {
    const failing = (error: unknown) =>
      ({
        messages: {
          create: async () => {
            throw error;
          },
        },
      }) as unknown as ExtractClient;
    const messageFor = async (error: unknown) => {
      const result = await extractFromImage(image, {
        client: failing(error),
        model: "m",
      });
      return result.ok ? "" : result.error;
    };

    const auth = new Anthropic.AuthenticationError(401, {}, "x", new Headers());
    const limit = new Anthropic.RateLimitError(429, {}, "x", new Headers());
    const timeout = new Anthropic.APIConnectionTimeoutError({});
    expect(await messageFor(auth)).toMatch(/API key/i);
    expect(await messageFor(limit)).toMatch(/rate limit|busy/i);
    expect(await messageFor(timeout)).toMatch(/too long|timed out/i);
  });
});

describe("createClient", () => {
  it("sets a request timeout and a small retry count", () => {
    const client = createClient("test-key");
    expect(client.timeout).toBe(30_000);
    expect(client.maxRetries).toBe(1);
  });
});
