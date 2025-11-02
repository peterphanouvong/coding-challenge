/**
 * OpenAI client configuration
 */

import OpenAI from "openai";

/**
 * Lazily initializes and returns the OpenAI client instance
 * This ensures environment variables are loaded before creating the client
 */
let _openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "Warning: OPENAI_API_KEY is not set. Streaming requests will fail."
      );
    }

    _openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  return _openaiInstance;
}

/**
 * Default model to use for chat completions
 */
export const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Default temperature for chat completions (lower = more deterministic)
 */
export const DEFAULT_TEMPERATURE = 0.1;

/**
 * Default top_p for chat completions
 */
export const DEFAULT_TOP_P = 0.2;
