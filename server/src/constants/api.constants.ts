/**
 * API-related constants
 * These constants are used across the application
 */

export const ERROR_MESSAGES = {
  MISSING_API_KEY: "Server missing OpenAI credentials",
  EMPTY_MESSAGES: "messages array is empty or invalid",
  STREAM_ERROR: "Failed to stream response",
  INVALID_REQUEST: "Invalid request data",
  RULE_NOT_FOUND: "Rule not found",
  FETCH_FAILED: "Failed to fetch data",
} as const;

export const SUCCESS_MESSAGES = {
  RULE_CREATED: "Rule created successfully",
  RULE_UPDATED: "Rule updated successfully",
  RULE_DELETED: "Rule deleted successfully",
} as const;
