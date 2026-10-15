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

// Server only. The API key is read from ANTHROPIC_API_KEY by the SDK.
// Never throws: every failure comes back as { ok: false, error }.
export async function extractFromImage(
  image: ExtractImage,
  options: ExtractOptions = {},
): Promise<ParseOutcome> {
  try {
    const client = options.client ?? new Anthropic();
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
      tool_choice: { type: "tool", name: TOOL_NAME },
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
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Extraction failed: ${message}` };
  }
}
