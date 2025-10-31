import path from "path";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import OpenAI from "openai";
import { z } from "zod";
import { RuleEngine } from "./services/ruleEngine";
import { seedRules } from "./seed-data";
import { ExtractedInfo, RoutingDecision } from "./types";

// Load environment variables from the project root first, then allow local overrides in server/.env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "Warning: OPENAI_API_KEY is not set. Streaming requests will fail."
  );
}

const app = express();
const port = Number.parseInt(process.env.PORT ?? "5000", 10);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// Initialize rule engine with seed data
const ruleEngine = new RuleEngine();
let currentRules = [...seedRules]; // In production, load from database

type ChatCompletionMessageParam =
  OpenAI.Chat.Completions.ChatCompletionMessageParam;
type StreamChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
type ChatStream = AsyncIterable<StreamChunk> & { controller?: AbortController };

type BasicRole = Extract<
  ChatCompletionMessageParam["role"],
  "system" | "user" | "assistant"
>;
type BasicMessage = { role: BasicRole; content: string };

const allowedRoles: ReadonlySet<BasicRole> = new Set<BasicRole>([
  "system",
  "user",
  "assistant",
]);

// Zod schema for request extraction validation
const extractRequestSchema = z.object({
  requestType: z.enum([
    "contracts",
    "employment_hr",
    "litigation_disputes",
    "intellectual_property",
    "regulatory_compliance",
    "corporate_ma",
    "real_estate",
    "privacy_data",
    "general_advice",
  ]),
  location: z.enum([
    "australia",
    "united states",
    "united kingdom",
    "canada",
    "europe",
    "asia_pacific",
    "other",
  ]),
  summary: z.string(),
  value: z.number().optional(),
  department: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
});

// Function definition for the AI agent to extract information
const extractInfoTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "extract_request_info",
    description:
      "Call this immediately once you can infer the request type and location from the user's message. The rule engine handles the rest.",
    parameters: {
      type: "object",
      properties: {
        requestType: {
          type: "string",
          enum: [
            "contracts",
            "employment_hr",
            "litigation_disputes",
            "intellectual_property",
            "regulatory_compliance",
            "corporate_ma",
            "real_estate",
            "privacy_data",
            "general_advice",
          ],
          description: "The type of legal request (infer from context)",
        },
        location: {
          type: "string",
          enum: [
            "australia",
            "united states",
            "united kingdom",
            "canada",
            "europe",
            "asia_pacific",
            "other",
          ],
          description: "Geographic location (use 'other' if unsure)",
        },
        summary: {
          type: "string",
          description: "Brief summary of what the user needs",
        },
        value: {
          type: "number",
          description: "Contract/deal value in dollars (optional)",
        },
        department: {
          type: "string",
          description: "User's department (optional)",
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "How urgent (optional)",
        },
      },
      required: ["requestType", "location", "summary"],
    },
  },
};

const sanitizeMessages = (messages: unknown): BasicMessage[] => {
  if (!Array.isArray(messages)) {
    return [];
  }

  const sanitized: BasicMessage[] = [];

  for (const raw of messages) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const maybeMessage = raw as Record<string, unknown>;
    const role = maybeMessage.role;
    const content = maybeMessage.content;

    if (typeof role !== "string" || typeof content !== "string") {
      continue;
    }

    if (!allowedRoles.has(role as BasicRole)) {
      continue;
    }

    sanitized.push({ role: role as BasicRole, content });
  }

  return sanitized;
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Rule Management API Endpoints

// GET all rules
app.get("/api/rules", (_req: Request, res: Response) => {
  res.json(currentRules);
});

// GET rules grouped by assignee
app.get("/api/rules/by-assignee", (_req: Request, res: Response) => {
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
app.get("/api/attorneys", (_req: Request, res: Response) => {
  const attorneys = [...new Set(currentRules.map((r) => r.action.assignTo))];
  res.json(attorneys);
});

// GET single rule by ID
app.get("/api/rules/:id", (req: Request, res: Response) => {
  const rule = currentRules.find((r) => r.id === req.params.id);
  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }
  res.json(rule);
});

// POST create new rule
app.post("/api/rules", (req: Request, res: Response) => {
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
app.put("/api/rules/:id", (req: Request, res: Response) => {
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
app.delete("/api/rules/:id", (req: Request, res: Response) => {
  const index = currentRules.findIndex((r) => r.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }

  currentRules.splice(index, 1);
  res.status(204).send();
});

// POST test a rule against sample data
app.post("/api/rules/:id/test", (req: Request, res: Response) => {
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

app.post("/api/chat", async (req: Request, res: Response) => {
  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: "Server missing OpenAI credentials" });
    return;
  }

  const basicMessages = sanitizeMessages(req.body?.messages);

  if (basicMessages.length === 0) {
    res.status(400).json({ error: "messages array is empty or invalid" });
    return;
  }

  // Build conversation context from user messages
  const conversationText = basicMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");

  const chatMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are a legal triage assistant for Acme Corp. Your job is to quickly connect employees with the right legal team member.

CRITICAL: Call extract_request_info as soon as you can reasonably infer the request type and location. Don't ask unnecessary questions.

PROCESS:
1. Read the user's message and immediately infer the request type and location if possible
2. If you can make a reasonable guess about both, call extract_request_info RIGHT AWAY
3. Only ask ONE clarifying question if both requestType AND location are completely unclear
4. The rule engine will find the best match - your job is just to extract basic info quickly

REQUEST TYPES (infer from context):
- contracts: agreements, NDAs, terms, vendor contracts
- employment_hr: hiring, firing, HR issues, workplace problems
- litigation_disputes: lawsuits, disputes, legal threats
- intellectual_property: trademarks, patents, IP, copyrights
- regulatory_compliance: regulations, compliance, licenses
- corporate_ma: fundraising, M&A, acquisitions, investments
- real_estate: property, leases, office space
- privacy_data: data privacy, GDPR, security breaches
- general_advice: anything unclear or general

LOCATIONS (infer or assume):
- australia, united states, united kingdom, canada, europe, asia_pacific, other

IMPORTANT: Users are NOT lawyers. Use simple language. If unsure about location, assume "other" and let the rule engine decide.`,
    },
    ...basicMessages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  try {
    // If you are using the free tier in groq, beware that there are rate limits.
    // For more info, check out:
    //   https://console.groq.com/docs/rate-limits
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use a model that supports function calling
      messages: chatMessages,
      tools: [extractInfoTool],
      tool_choice: "auto",
      stream: true,
    });

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
        if (toolCallName === "extract_request_info") {
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
              const requestTypeFormatted = args.requestType
                .split("_")
                .map(
                  (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join(" ");

              res.write(
                `## ✅ We've got you covered!\n\n` +
                  `Your request has been assigned to **${decision.assignTo}**.\n\n` +
                  `**What happens next?**\n` +
                  `${
                    decision.assignTo
                  } specializes in ${requestTypeFormatted.toLowerCase()} matters and will review your request soon. They'll reach out if they need any additional information.\n\n` +
                  (decision.confidence && decision.confidence < 100
                    ? `*This routing is based on the information provided (${decision.confidence}% match).*\n\n`
                    : "") +
                  `---`
              );
            } else if (decision.needsClarification) {
              res.write(
                `## 🤔 Just need a bit more info\n\n` +
                  `${decision.needsClarification.question}\n\n` +
                  `---`
              );
            } else {
              res.write(
                `## 👋 We'll take it from here\n\n` +
                  `I couldn't find a specific team member for this request, but don't worry! I've forwarded it to our general legal team at **legal-general@acme.corp** who will make sure it gets to the right person.\n\n` +
                  `Someone will be in touch shortly.\n\n` +
                  `---`
              );
            }
          } catch (parseError) {
            console.error("Error parsing tool call arguments:", parseError);
            res.write("\n\n[Error processing routing]");
          }
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("Streaming error:", error);

    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream response" });
      return;
    }

    res.write("\n[Stream error]\n");
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
