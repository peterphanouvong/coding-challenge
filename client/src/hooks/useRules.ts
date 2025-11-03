/**
 * Custom hook for rule management
 * Encapsulates rule CRUD operations and state management
 */

import { useState, useCallback, useEffect } from "react";
import { rulesApi, ApiError } from "@/lib/api";
import type { Rule } from "@/types";
import { ERROR_MESSAGES } from "@/lib/constants";

interface UseRulesReturn {
  rulesByAssignee: Record<string, Rule[]>;
  loading: boolean;
  error: string | null;
  fetchRules: () => Promise<void>;
  createRule: (rule: Partial<Rule>) => Promise<void>;
  updateRule: (id: string, rule: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing rules
 */
export function useRules(): UseRulesReturn {
  const [rulesByAssignee, setRulesByAssignee] = useState<
    Record<string, Rule[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Fetch all rules grouped by assignee
   */
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await rulesApi.getByAssignee();
      setRulesByAssignee(data);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError ? err.message : ERROR_MESSAGES.FETCH_ERROR;
      console.error("Failed to fetch rules:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new rule
   */
  const createRule = useCallback(
    async (rule: Partial<Rule>) => {
      setError(null);

      try {
        await rulesApi.create(rule);
        await fetchRules(); // Refresh rules after creation
      } catch (err) {
        const errorMessage =
          err instanceof ApiError ? err.message : "Failed to create rule";
        console.error("Failed to create rule:", err);
        setError(errorMessage);
        throw err; // Re-throw so caller can handle
      }
    },
    [fetchRules]
  );

  /**
   * Update an existing rule
   */
  const updateRule = useCallback(
    async (id: string, rule: Partial<Rule>) => {
      setError(null);

      try {
        await rulesApi.update(id, rule);
        await fetchRules(); // Refresh rules after update
      } catch (err) {
        const errorMessage =
          err instanceof ApiError ? err.message : "Failed to update rule";
        console.error("Failed to update rule:", err);
        setError(errorMessage);
        throw err;
      }
    },
    [fetchRules]
  );

  /**
   * Delete a rule
   */
  const deleteRule = useCallback(
    async (id: string) => {
      setError(null);

      try {
        await rulesApi.delete(id);
        await fetchRules(); // Refresh rules after deletion
      } catch (err) {
        const errorMessage =
          err instanceof ApiError ? err.message : "Failed to delete rule";
        console.error("Failed to delete rule:", err);
        setError(errorMessage);
        throw err;
      }
    },
    [fetchRules]
  );

  // Fetch rules on mount
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rulesByAssignee,
    loading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    clearError,
  };
}
