import OpenAI from "openai";
import { REQUEST_TYPES, LOCATIONS, URGENCY_LEVELS } from "../constants/legal.constants";

// Function definition for requesting clarification via UI
export const requestClarificationTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "request_clarification_ui",
    description:
      "Call this immediately when you cannot determine the request type or location from the user's message. Shows an interactive form to the user.",
    parameters: {
      type: "object",
      properties: {
        missingFields: {
          type: "array",
          items: {
            type: "string",
            enum: ["requestType", "location"],
          },
          description: "Which fields need clarification",
        },
        contextMessage: {
          type: "string",
          description:
            "Brief message to show before the form (e.g., 'I need a bit more information to route your request')",
        },
        inferredRequestType: {
          type: "string",
          enum: [...REQUEST_TYPES],
          description:
            "Your best guess for the request type, will be pre-selected in the form",
        },
      },
      required: ["missingFields", "contextMessage"],
    },
  },
};

// Function definition for the AI agent to extract information
export const extractInfoTool: OpenAI.Chat.Completions.ChatCompletionTool = {
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
          enum: [...REQUEST_TYPES],
          description:
            "The type of legal request (infer from context, do not pick general_advice unless specified by user)",
        },
        location: {
          type: "string",
          enum: [...LOCATIONS],
          description: "Geographic location (clarify with user if unsure)",
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
          enum: [...URGENCY_LEVELS],
          description: "How urgent (optional)",
        },
      },
      required: ["requestType", "location", "summary"],
    },
  },
};
