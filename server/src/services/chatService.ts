/**
 * Chat service handling OpenAI streaming and tool call execution
 */

import { Request, Response } from "express";
import OpenAI from "openai";
import { getOpenAIClient, DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_TOP_P } from "../config/openai.config";
import { generateSystemPrompt } from "../ai/systemPrompt";
import { requestClarificationTool, extractInfoTool } from "../ai/tools";
import { ExtractedInfo, RoutingDecision, Rule } from "../types";
import { RuleEngine } from "./ruleEngine";
import {
  buildClarificationForm,
  buildSuccessResponse,
  buildClarificationResponse,
  buildFallbackResponse,
} from "./responseBuilder";

type ChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;

interface BasicMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Handles the streaming chat completion with OpenAI
 */
export async function handleChatStream(
  req: Request,
  res: Response,
  basicMessages: BasicMessage[],
  ruleEngine: RuleEngine,
  currentRules: Rule[]
): Promise<void> {
  // Build conversation context from user messages
  const conversationText = basicMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");

  const chatMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: generateSystemPrompt(),
    },
    ...basicMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const openai = getOpenAIClient();

  const stream = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: chatMessages,
    tools: [requestClarificationTool, extractInfoTool],
    tool_choice: "auto",
    stream: true,
    temperature: DEFAULT_TEMPERATURE,
    top_p: DEFAULT_TOP_P,
  });

  // Set streaming headers
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  (res as Response & { flushHeaders?: () => void }).flushHeaders?.();

  const abort = () => {
    try {
      stream.controller?.abort?.();
    } catch (abortError) {
      console.error("Error aborting OpenAI stream:", abortError);
    }
  };

  req.on("close", abort);
  req.on("error", abort);

  let toolCallId = "";
  let toolCallName = "";
  let toolCallArgs = "";

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (!delta) continue;

    // Handle regular text content
    if (delta.content) {
      res.write(delta.content);
    }

    // Handle tool calls
    if (delta.tool_calls) {
      for (const toolCall of delta.tool_calls) {
        if (toolCall.id) {
          toolCallId = toolCall.id;
        }
        if (toolCall.function?.name) {
          toolCallName = toolCall.function.name;
        }
        if (toolCall.function?.arguments) {
          toolCallArgs += toolCall.function.arguments;
        }
      }
    }

    // If the finish reason is tool_calls, execute the function
    if (chunk.choices[0]?.finish_reason === "tool_calls") {
      if (toolCallName === "request_clarification_ui") {
        handleClarificationToolCall(res, toolCallArgs);
      } else if (toolCallName === "extract_request_info") {
        handleExtractInfoToolCall(
          res,
          toolCallArgs,
          conversationText,
          ruleEngine,
          currentRules
        );
      }
    }
  }

  res.end();
}

/**
 * Handles the request_clarification_ui tool call
 */
function handleClarificationToolCall(res: Response, toolCallArgs: string): void {
  try {
    const args = JSON.parse(toolCallArgs);
    const clarificationForm = buildClarificationForm(args);
    res.write(clarificationForm);
  } catch (parseError) {
    console.error("Error parsing clarification tool call:", parseError);
    res.write(
      "\\n\\nCould you please tell me more about your request and where you're located?"
    );
  }
}

/**
 * Handles the extract_request_info tool call
 */
function handleExtractInfoToolCall(
  res: Response,
  toolCallArgs: string,
  conversationText: string,
  ruleEngine: RuleEngine,
  currentRules: Rule[]
): void {
  try {
    const args = JSON.parse(toolCallArgs);

    // Build ExtractedInfo object
    const extractedInfo: ExtractedInfo = {
      requestType: args.requestType,
      location: args.location,
      value: args.value,
      department: args.department,
      urgency: args.urgency,
      rawText: conversationText,
    };

    // Run through rule engine
    const decision: RoutingDecision = ruleEngine.route(
      extractedInfo,
      currentRules
    );

    console.log("Routing decision:", decision);

    // Format response based on decision
    if (decision.matched && decision.assignTo) {
      res.write(buildSuccessResponse(decision, args));
    } else if (decision.needsClarification) {
      res.write(buildClarificationResponse(decision, args));
    } else {
      res.write(buildFallbackResponse(args));
    }
  } catch (parseError) {
    console.error("Error parsing tool call arguments:", parseError);
    res.write("\\n\\n[Error processing routing]");
  }
}
