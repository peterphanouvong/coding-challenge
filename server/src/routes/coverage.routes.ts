/**
 * Rule coverage analysis API routes
 */

import { Router, Request, Response } from "express";
import { Rule } from "../types";
import { RuleEngine } from "../services/ruleEngine";
import { RuleCoverageAnalyzer } from "../services/ruleCoverageAnalyzer";

const router = Router();

/**
 * Creates a coverage router with dependency injection for rules and rule engine
 */
export function createCoverageRouter(
  currentRules: Rule[],
  ruleEngine: RuleEngine
): Router {
  router.get("/", (req: Request, res: Response) => {
    try {
      const analyzer = new RuleCoverageAnalyzer(ruleEngine);
      const report = analyzer.analyzeCoverage(currentRules);

      res.json(report);
    } catch (error) {
      console.error("Error analyzing rule coverage:", error);
      res.status(500).json({ error: "Failed to analyze rule coverage" });
    }
  });

  return router;
}

export default router;
