/**
 * Chat API routes
 */

import { Router, Request, Response } from "express";
import { Rule } from "../types";
import { RuleEngine } from "../services/ruleEngine";
import { sanitizeMessages } from "../middleware/validation";
import { handleChatStream } from "../services/chatService";

const router = Router();

/**
 * Creates a chat router with dependency injection for rules and rule engine
 */
export function createChatRouter(
  currentRules: Rule[],
  ruleEngine: RuleEngine
): Router {
  router.post("/", async (req: Request, res: Response) => {
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "Server missing OpenAI credentials" });
      return;
    }

    const basicMessages = sanitizeMessages(req.body?.messages);

    if (basicMessages.length === 0) {
      res.status(400).json({ error: "messages array is empty or invalid" });
      return;
    }

    try {
      await handleChatStream(req, res, basicMessages, ruleEngine, currentRules);
    } catch (error) {
      console.error("Streaming error:", error);

      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream response" });
        return;
      }

      res.write("\\n[Stream error]\\n");
      res.end();
    }
  });

  return router;
}

export default router;
