/**
 * Validation middleware and utilities for sanitizing and validating request data
 */

type BasicRole = "system" | "user" | "assistant";
type BasicMessage = { role: BasicRole; content: string };

const allowedRoles: ReadonlySet<BasicRole> = new Set<BasicRole>([
  "system",
  "user",
  "assistant",
]);

/**
 * Sanitizes an array of messages to ensure they only contain allowed roles and valid content.
 * Filters out any invalid messages and returns a clean array.
 *
 * @param messages - Raw messages from client request
 * @returns Array of sanitized messages with only allowed roles
 */
export const sanitizeMessages = (messages: unknown): BasicMessage[] => {
  if (!Array.isArray(messages)) {
    return [];
  }

  const sanitized: BasicMessage[] = [];

  for (const raw of messages) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const maybeMessage = raw as Record<string, unknown>;
    const role = maybeMessage.role;
    const content = maybeMessage.content;

    if (typeof role !== "string" || typeof content !== "string") {
      continue;
    }

    if (!allowedRoles.has(role as BasicRole)) {
      continue;
    }

    sanitized.push({ role: role as BasicRole, content });
  }

  return sanitized;
};
