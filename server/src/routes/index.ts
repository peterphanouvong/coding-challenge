/**
 * Routes aggregator - combines all route modules
 */

import { Router } from "express";
import healthRoutes from "./health.routes";
import { createRulesRouter } from "./rules.routes";
import { createChatRouter } from "./chat.routes";
import { createCoverageRouter } from "./coverage.routes";
import { Rule } from "../types";
import { RuleEngine } from "../services/ruleEngine";

/**
 * Creates and configures all application routes
 */
export function createRoutes(currentRules: Rule[], ruleEngine: RuleEngine): Router {
  const router = Router();

  // Health check
  router.use(healthRoutes);

  // API routes
  router.use("/api/rules", createRulesRouter(currentRules, ruleEngine));
  router.use("/api/chat", createChatRouter(currentRules, ruleEngine));
  router.use("/api/coverage", createCoverageRouter(currentRules, ruleEngine));

  return router;
}
