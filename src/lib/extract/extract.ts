import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "../config.ts";
import { parseExtraction, type ParseOutcome } from "./parse.ts";
import {
  SYSTEM_PROMPT,
  TOOL_NAME,
  TOOL_SCHEMA,
  USER_PROMPT,
} from "./prompt.ts";

export type ExtractClient = Pick<Anthropic, "messages">;

export type ExtractImage = {
  data: Buffer;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
};

type ExtractOptions = { client?: ExtractClient; model?: string };

// The spec expects an answer within 15 s. A hung call must not block the review screen.
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 1;

export function createClient(apiKey?: string): Anthropic {
  return new Anthropic({
    apiKey,
    timeout: TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
  });
}

// Short messages that are safe to show the user. The SDK's own error text can
// carry request IDs and body fragments, so it is only logged on the server.
function describeError(error: unknown): string {
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return "Reading the image took too long. Try again or enter it by hand.";
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "The AI service is busy (rate limit). Try again in a minute.";
  }
  return "Could not read the image. Try again or enter it by hand.";
}

// Server only. The API key is read from ANTHROPIC_API_KEY by the SDK.
// Never throws: every failure comes back as { ok: false, error }.
export async function extractFromImage(
  image: ExtractImage,
  options: ExtractOptions = {},
): Promise<ParseOutcome> {
  try {
    const client = options.client ?? createClient();
    const model = options.model ?? getConfig().anthropicModel;

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: TOOL_NAME,
          description: "Record the transaction shown on the image.",
          input_schema: TOOL_SCHEMA,
        },
      ],
      // Forcing the tool ({ type: "tool" }) is rejected with a 400 by this model.
      // The system prompt tells it to call the tool; no call is handled below.
      tool_choice: { type: "auto" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.data.toString("base64"),
              },
            },
            { type: "text", text: USER_PROMPT },
          ],
        },
      ],
    });

    const call = response.content.find((block) => block.type === "tool_use");
    if (!call || call.type !== "tool_use") {
      return { ok: false, error: "The model did not return a transaction" };
    }
    return parseExtraction(call.input);
  } catch (error) {
    const detail = error instanceof Error ? error.name : typeof error;
    console.error(`Extraction failed (${detail})`);
    return { ok: false, error: describeError(error) };
  }
}
