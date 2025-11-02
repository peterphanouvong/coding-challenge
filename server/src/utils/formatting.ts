/**
 * Utility functions for formatting strings and data
 */

/**
 * Formats a string with underscores into Title Case
 * Example: "employment_hr" -> "Employment Hr"
 *
 * @param str - String to format (typically with underscores)
 * @returns Title cased string
 */
export function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats a request type or location string for display
 * Example: "employment_hr" -> "Employment Hr", "united states" -> "United States"
 *
 * @param value - Value to format
 * @returns Formatted string
 */
export function formatForDisplay(value: string): string {
  // Handle underscore-separated values
  if (value.includes("_")) {
    return toTitleCase(value);
  }

  // Handle space-separated values (like "united states")
  return value
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
