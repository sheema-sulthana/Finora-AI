import { GoogleGenAI } from "@google/genai";

/* =========================================================
   TYPES
   ========================================================= */

export type ContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    }
  | {
      type: "file";
      file: {
        filename: string;
        file_data: string;
      };
    };

export type GwMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentBlock[];
};

/* =========================================================
   GEMINI CONFIG
   ========================================================= */

/*
 * IMPORTANT:
 * Do not initialize Gemini at module import time.
 * The upload/dashboard routes import this file during SSR, and a missing
 * API key must not crash the entire authenticated application.
 */
function getGeminiClient() {
  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your .env file and restart the development server.",
    );
  }

  return new GoogleGenAI({ apiKey });
}

/*
 * Keep the model configurable. If your .env already defines GEMINI_MODEL,
 * it will be used. Otherwise use the stable flash model.
 */
const PRIMARY_MODEL = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";

const FALLBACK_MODEL = process.env["GEMINI_FALLBACK_MODEL"] || "gemini-3.5-flash-lite";

// Current production-capable Flash fallback chain.
// The first model is used normally; if Gemini returns a temporary 503/429,
// the request moves to the next model without requiring a second upload.
const GEMINI_FALLBACK_MODELS = [
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
].filter((model, index, list) => Boolean(model) && list.indexOf(model) === index);

/*
 * Gemini recommends the Files API for larger inputs. We use it for PDFs and
 * binary files above this threshold so the model request itself does not
 * contain a huge base64 payload. The browser still sends the file to the
 * server function once, but Gemini receives it through its file URI.
 */
const FILE_API_THRESHOLD_BYTES = 4 * 1024 * 1024;

/* =========================================================
   DATA URL PARSER
   ========================================================= */

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);

  if (!match) {
    throw new Error("Invalid file data URL.");
  }

  const mimeType = match[1];
  const data = match[2];

  if (!mimeType || !data) {
    throw new Error("Invalid file data URL.");
  }

  return {
    mimeType,
    data,
  };
}

/* =========================================================
   CONVERT OUR MESSAGE FORMAT TO GEMINI
   ========================================================= */

async function prepareUploadedFiles(ai: GoogleGenAI, messages: GwMessage[]) {
  const uploaded = new Map<string, { uri: string; mimeType: string; name?: string }>();

  for (const message of messages) {
    if (typeof message.content === "string") continue;

    for (const block of message.content) {
      if (block.type !== "file" && block.type !== "image_url") {
        continue;
      }

      const dataUrl = block.type === "file" ? block.file.file_data : block.image_url.url;

      if (uploaded.has(dataUrl)) continue;

      const parsed = parseDataUrl(dataUrl);
      const bytes = Buffer.from(parsed.data, "base64");

      const shouldUseFileApi =
        parsed.mimeType === "application/pdf" || bytes.byteLength > FILE_API_THRESHOLD_BYTES;

      if (!shouldUseFileApi) continue;

      const blob = new Blob([bytes], {
        type: parsed.mimeType,
      });

      const displayName = block.type === "file" ? block.file.filename : "finora-upload";

      const file = await ai.files.upload({
        file: blob,
        config: {
          mimeType: parsed.mimeType,
          displayName,
        },
      });

      if (!file.uri || !file.mimeType) {
        throw new Error("Gemini uploaded the file but did not return a usable file URI.");
      }

      let processed = file;

      if (processed.state === "PROCESSING" && processed.name) {
        const fileName = processed.name;

        for (let attempt = 0; attempt < 24; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));

          processed = await ai.files.get({
            name: fileName,
          });

          if (processed.state !== "PROCESSING") break;
        }
      }

      if (processed.state === "FAILED") {
        throw new Error("Gemini could not process the uploaded document.");
      }

      if (!processed.uri || !processed.mimeType) {
        throw new Error("Gemini finished processing the file but no file URI is available.");
      }

      uploaded.set(
        dataUrl,
        processed.name
          ? {
              uri: processed.uri,
              mimeType: processed.mimeType,
              name: processed.name,
            }
          : {
              uri: processed.uri,
              mimeType: processed.mimeType,
            },
      );
    }
  }

  return uploaded;
}

function convertMessages(
  messages: GwMessage[],
  uploadedFiles?: Map<string, { uri: string; mimeType: string; name?: string }>,
) {
  let systemInstruction = "";

  const contents: Array<{
    role: "user" | "model";
    parts: Array<Record<string, unknown>>;
  }> = [];

  for (const message of messages) {
    if (message.role === "system") {
      if (typeof message.content === "string") {
        systemInstruction += message.content + "\n\n";
      } else {
        for (const block of message.content) {
          if (block.type === "text") {
            systemInstruction += block.text + "\n\n";
          }
        }
      }
      continue;
    }

    const role = message.role === "assistant" ? "model" : "user";
    const parts: Array<Record<string, unknown>> = [];

    if (typeof message.content === "string") {
      parts.push({ text: message.content });
    } else {
      for (const block of message.content) {
        if (block.type === "text") {
          parts.push({ text: block.text });
          continue;
        }

        const dataUrl = block.type === "file" ? block.file.file_data : block.image_url.url;
        const file = uploadedFiles?.get(dataUrl);

        if (file) {
          parts.push({
            fileData: {
              fileUri: file.uri,
              mimeType: file.mimeType,
            },
          });
          continue;
        }

        const parsed = parseDataUrl(dataUrl);

        parts.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.data,
          },
        });
      }
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  if (contents.length === 0) {
    throw new Error("No usable content was provided to Gemini.");
  }

  return {
    systemInstruction: systemInstruction.trim() || undefined,
    contents,
  };
}

/* =========================================================
   GEMINI GATEWAY
   ========================================================= */

export async function callGateway(
  messages: GwMessage[],
  _key?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    responseMimeType?: "application/json" | "text/plain";
  },
): Promise<string> {
  const ai = getGeminiClient();
  const uploadedFiles = await prepareUploadedFiles(ai, messages);
  const converted = convertMessages(messages, uploadedFiles);

  const models = GEMINI_FALLBACK_MODELS;

  let lastError: unknown = null;

  try {
    for (const model of models) {
      const maxAttempts = 1;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const config = {
            temperature: options?.temperature ?? 0.2,
            maxOutputTokens: options?.maxTokens ?? 8192,
            ...(converted.systemInstruction
              ? {
                  systemInstruction: converted.systemInstruction,
                }
              : {}),
            ...(options?.responseMimeType
              ? {
                  responseMimeType: options.responseMimeType,
                }
              : {}),
          };

          const response = await ai.models.generateContent({
            model,
            contents: converted.contents,
            config,
          });

          const text = response.text?.trim();

          if (!text) {
            throw new Error("Gemini returned an empty response.");
          }

          return text;
        } catch (error) {
          lastError = error;

          const message = error instanceof Error ? error.message : String(error);

          const temporary =
            message.includes("503") ||
            message.includes("UNAVAILABLE") ||
            message.includes("high demand") ||
            message.includes("429") ||
            message.includes("RESOURCE_EXHAUSTED") ||
            message.includes("rate limit") ||
            message.includes("temporarily unavailable");

          console.warn(
            `Gemini request failed on ${model}. Attempt ${attempt + 1}/${maxAttempts}.`,
            error,
          );

          if (!temporary) {
            break;
          }

          if (attempt + 1 < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
          }
        }
      }

      if (model !== models[models.length - 1]) {
        console.warn(
          `Switching Gemini model from ${model} to ${models[models.indexOf(model) + 1]}.`,
        );
      }
    }
  } finally {
    /*
     * Files uploaded through the Gemini Files API are temporary. Remove them
     * after this request so repeated statement uploads do not accumulate files.
     */
    for (const file of uploadedFiles.values()) {
      if (!file.name) continue;
      try {
        await ai.files.delete({ name: file.name });
      } catch (cleanupError) {
        console.warn("Could not delete temporary Gemini file:", cleanupError);
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError || "Unknown Gemini error");

  throw new Error(
    `Gemini analysis failed. Models tried: ${models.join(", ")}. Last error: ${message}`,
  );
}

/* =========================================================
   EXTRACTION SYSTEM PROMPT
   ========================================================= */

export const EXTRACTION_SYSTEM = `
You are Finora AI's financial document analysis engine.

Your job is to analyze financial transactions.

IMPORTANT RULES:

1. Extract ONLY information that actually exists.

2. NEVER invent:
- transactions
- dates
- merchants
- amounts
- salary
- savings
- balance
- income
- expenses

3. If information is unclear, use reasonable defaults only
for missing NON-FINANCIAL metadata such as:
- category
- payment method
- status

4. Do not invent transaction amounts.

5. Do not invent dates.

6. Do not invent merchants.

7. Focus on:
- spending
- transactions
- merchants
- categories
- unusual spending
- recurring expenses
- useful financial insights

8. Possible categories:

Food
Shopping
Transport
Bills
Entertainment
Healthcare
Education
Subscriptions
Rent
Travel
Personal Care
Other

9. Return ONLY valid JSON.

Return exactly:

{
  "transactions": [
    {
      "merchant": "string",
      "amount": 0,
      "type": "expense",
      "category": "Other",
      "date": "YYYY-MM-DD",
      "payment_method": "Unknown",
      "status": "completed"
    }
  ],
  "report": {
    "summary": "string",
    "insights": [],
    "suggestions": [],
    "comparison": {},
    "predictions": {},
    "health_score": 0,
    "health_reasons": []
  }
}

Be conservative and factual.
`;

/* =========================================================
   FINANCIAL COACH
   ========================================================= */

export function coachSystemPrompt(context: string): string {
  return `
You are Finora AI, a helpful personal finance assistant.

Use ONLY the financial information provided below.

NEVER invent:
- salary
- savings
- balance
- transactions
- income
- expenses
- merchants
- dates
- amounts

Focus on:
- spending
- categories
- merchants
- transaction patterns
- unusual expenses
- ways to reduce unnecessary spending

Keep answers simple and useful.

FINANCIAL DATA:

${context}
`;
}

/* =========================================================
   JSON PARSER
   ========================================================= */

export function parseJson<T>(text: string, fallback?: T): T {
  let cleaned = String(text || "").trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  /* Direct JSON */

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Continue.
  }

  /* JSON object */

  const objectStart = cleaned.indexOf("{");

  const objectEnd = cleaned.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd > objectStart) {
    try {
      return JSON.parse(cleaned.slice(objectStart, objectEnd + 1)) as T;
    } catch {
      // Continue.
    }
  }

  /* JSON array */

  const arrayStart = cleaned.indexOf("[");

  const arrayEnd = cleaned.lastIndexOf("]");

  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1)) as T;
    } catch {
      // Continue.
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error("AI returned invalid JSON.");
}
