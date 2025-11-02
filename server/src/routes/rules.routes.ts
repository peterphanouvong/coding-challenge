/**
 * Rule management API routes
 */

import { Router, Request, Response } from "express";
import { Rule } from "../types";
import { RuleEngine } from "../services/ruleEngine";

const router = Router();

/**
 * Creates a rules router with dependency injection for rules array and rule engine
 */
export function createRulesRouter(
  currentRules: Rule[],
  ruleEngine: RuleEngine
): Router {
  // GET all rules
  router.get("/", (_req: Request, res: Response) => {
    res.json(currentRules);
  });

  // GET rules grouped by assignee
  router.get("/by-assignee", (_req: Request, res: Response) => {
    const grouped = currentRules.reduce((acc, rule) => {
      const assignee = rule.action.assignTo;
      if (!acc[assignee]) {
        acc[assignee] = [];
      }
      acc[assignee].push(rule);
      return acc;
    }, {} as Record<string, typeof currentRules>);

    res.json(grouped);
  });

  // GET unique attorneys/assignees
  router.get("/attorneys", (_req: Request, res: Response) => {
    const attorneys = [...new Set(currentRules.map((r) => r.action.assignTo))];
    res.json(attorneys);
  });

  // GET single rule by ID
  router.get("/:id", (req: Request, res: Response) => {
    const rule = currentRules.find((r) => r.id === req.params.id);
    if (!rule) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }
    res.json(rule);
  });

  // POST create new rule
  router.post("/", (req: Request, res: Response) => {
    const newRule = req.body;

    // Validate required fields
    if (!newRule.name || !newRule.conditions || !newRule.action?.assignTo) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Generate ID if not provided
    if (!newRule.id) {
      newRule.id = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    // Set defaults
    newRule.enabled = newRule.enabled !== false;
    newRule.priority = newRule.priority || 1;
    newRule.createdAt = new Date().toISOString();
    newRule.matchCount = 0;

    currentRules.push(newRule);
    res.status(201).json(newRule);
  });

  // PUT update existing rule
  router.put("/:id", (req: Request, res: Response) => {
    const index = currentRules.findIndex((r) => r.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    const updatedRule = {
      ...currentRules[index],
      ...req.body,
      id: req.params.id, // Prevent ID changes
    };

    currentRules[index] = updatedRule;
    res.json(updatedRule);
  });

  // DELETE rule
  router.delete("/:id", (req: Request, res: Response) => {
    const index = currentRules.findIndex((r) => r.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    currentRules.splice(index, 1);
    res.status(204).send();
  });

  // POST test a rule against sample data
  router.post("/:id/test", (req: Request, res: Response) => {
    const rule = currentRules.find((r) => r.id === req.params.id);

    if (!rule) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    const extractedInfo = req.body.extractedInfo;
    if (!extractedInfo) {
      res.status(400).json({ error: "Missing extractedInfo in request body" });
      return;
    }

    const result = ruleEngine.testRule(rule, extractedInfo);
    res.json(result);
  });

  return router;
}

export default router;
