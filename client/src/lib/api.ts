/**
 * Centralized API service for making HTTP requests
 * Handles error formatting and provides consistent interface
 */

import { API_BASE_URL, API_ENDPOINTS, ERROR_MESSAGES } from "./constants";
import type { Rule } from "@/types";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new ApiError(
        response.status,
        errorData.error || ERROR_MESSAGES.NETWORK_ERROR
      );
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.text() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, ERROR_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * Rules API
 */
export const rulesApi = {
  /**
   * Fetch all rules
   */
  getAll: async (): Promise<Rule[]> => {
    return fetchWithErrorHandling<Rule[]>(
      `${API_BASE_URL}${API_ENDPOINTS.RULES}`
    );
  },

  /**
   * Fetch rules grouped by assignee
   */
  getByAssignee: async (): Promise<Record<string, Rule[]>> => {
    return fetchWithErrorHandling<Record<string, Rule[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.RULES_BY_ASSIGNEE}`
    );
  },

  /**
   * Fetch a single rule by ID
   */
  getById: async (id: string): Promise<Rule> => {
    return fetchWithErrorHandling<Rule>(
      `${API_BASE_URL}${API_ENDPOINTS.RULES}/${id}`
    );
  },

  /**
   * Create a new rule
   */
  create: async (rule: Partial<Rule>): Promise<Rule> => {
    return fetchWithErrorHandling<Rule>(
      `${API_BASE_URL}${API_ENDPOINTS.RULES}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      }
    );
  },

  /**
   * Update an existing rule
   */
  update: async (id: string, rule: Partial<Rule>): Promise<Rule> => {
    return fetchWithErrorHandling<Rule>(
      `${API_BASE_URL}${API_ENDPOINTS.RULES}/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      }
    );
  },

  /**
   * Delete a rule
   */
  delete: async (id: string): Promise<void> => {
    return fetchWithErrorHandling<void>(
      `${API_BASE_URL}${API_ENDPOINTS.RULES}/${id}`,
      {
        method: "DELETE",
      }
    );
  },
};

/**
 * Chat API
 */
export const chatApi = {
  /**
   * Send chat messages and get streaming response
   * Returns a ReadableStream for processing chunks
   */
  sendMessage: async (
    messages: Array<{ role: string; content: string }>
  ): Promise<Response> => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: ERROR_MESSAGES.STREAM_ERROR }));
      throw new ApiError(response.status, errorData.error);
    }

    if (!response.body) {
      throw new ApiError(500, ERROR_MESSAGES.STREAM_ERROR);
    }

    return response;
  },
};

/**
 * Coverage API
 */
export const coverageApi = {
  /**
   * Get coverage analysis
   */
  getAnalysis: async () => {
    return fetchWithErrorHandling(
      `${API_BASE_URL}${API_ENDPOINTS.COVERAGE}`
    );
  },
};
