/**
 * Server configuration constants
 */

/**
 * Gets the server port from environment or defaults to 5000
 */
export function getPort(): number {
  return Number.parseInt(process.env.PORT ?? "5000", 10);
}

/**
 * Gets CORS configuration from environment
 */
export function getCorsOptions() {
  return {
    origin: process.env.CLIENT_URL || "*",
  };
}

/**
 * JSON body parser limit
 */
export const JSON_LIMIT = "1mb";
