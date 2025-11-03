/**
 * Application constants
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8999";

export const API_ENDPOINTS = {
  CHAT: "/api/chat",
  RULES: "/api/rules",
  RULES_BY_ASSIGNEE: "/api/rules/by-assignee",
  COVERAGE: "/api/coverage",
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Failed to connect to the server. Please try again.",
  STREAM_ERROR: "Failed to stream response. Please try again.",
  FETCH_ERROR: "Failed to load data. Please refresh the page.",
} as const;
