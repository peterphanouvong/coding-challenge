/**
 * Chat API routes
 */

import { Router, Request, Response, NextFunction } from "express";
import { Rule } from "../types";
import { RuleEngine } from "../services/ruleEngine";
import { sanitizeMessages } from "../middleware/validation";
import { handleChatStream } from "../services/chatService";
import { AppError, catchAsync } from "../middleware/errorHandler";
import { ERROR_MESSAGES } from "../constants/api.constants";

const router = Router();

/**
 * Creates a chat router with dependency injection for rules and rule engine
 */
export function createChatRouter(
  currentRules: Rule[],
  ruleEngine: RuleEngine
): Router {
  router.post(
    "/",
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
      // Validate OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        throw new AppError(500, ERROR_MESSAGES.MISSING_API_KEY);
      }

      // Validate and sanitize messages
      const basicMessages = sanitizeMessages(req.body?.messages);
      if (basicMessages.length === 0) {
        throw new AppError(400, ERROR_MESSAGES.EMPTY_MESSAGES);
      }

      // Handle streaming response
      try {
        await handleChatStream(
          req,
          res,
          basicMessages,
          ruleEngine,
          currentRules
        );
      } catch (error) {
        console.error("Streaming error:", error);

        // If headers already sent, can't use standard error handling
        if (res.headersSent) {
          res.write("\n[Stream error]\n");
          res.end();
          return;
        }

        // Pass to error handler
        throw new AppError(500, ERROR_MESSAGES.STREAM_ERROR);
      }
    })
  );

  return router;
}

export default router;
