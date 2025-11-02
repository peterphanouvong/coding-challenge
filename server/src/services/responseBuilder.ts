/**
 * Service for building formatted responses with UI components for the chat interface
 */

import { RoutingDecision } from "../types";
import { formatForDisplay } from "../utils/formatting";
import {
  REQUEST_TYPE_OPTIONS,
  LOCATION_OPTIONS,
} from "../constants/legal.constants";

interface SummaryField {
  key: string;
  label: string;
  value: string | number;
  editable: boolean;
}

interface UIComponent {
  type: string;
  [key: string]: any;
}

/**
 * Builds a clarification form UI component
 */
export function buildClarificationForm(args: {
  missingFields?: string[];
  contextMessage: string;
  inferredRequestType?: string;
}): string {
  const uiComponent: UIComponent = {
    type: "clarification_form",
    fields: args.missingFields || ["requestType", "location"],
    contextMessage: args.contextMessage,
    inferredRequestType: args.inferredRequestType,
    options: {
      requestType: REQUEST_TYPE_OPTIONS,
      location: LOCATION_OPTIONS,
    },
  };

  return `__UI_COMPONENT__${JSON.stringify(uiComponent)}__END_UI__`;
}

/**
 * Builds an editable summary component
 */
export function buildEditableSummary(fields: SummaryField[]): string {
  if (fields.length === 0) {
    return "";
  }

  const summaryComponent = {
    type: "editable_summary",
    fields,
  };

  return `__SUMMARY__${JSON.stringify(summaryComponent)}__END_SUMMARY__`;
}

/**
 * Builds action buttons component (e.g., email buttons, navigation links)
 */
export function buildActionButtons(
  assignTo: string,
  requestType: string,
  summary?: string
): string {
  const requestTypeFormatted = formatForDisplay(requestType);

  const actions = {
    type: "action_buttons",
    actions: [
      {
        type: "email",
        label: `Email ${assignTo}`,
        email: assignTo,
        subject: `Legal Request: ${requestTypeFormatted}`,
        body: `Hi,\n\nI have a ${requestTypeFormatted.toLowerCase()} request that I'd like to discuss.\n\n${
          summary || ""
        }\n\nThank you!`,
      },
      {
        type: "navigate",
        label: `View ${assignTo.split("@")[0]}'s Profile`,
        path: "/configure",
        highlight: {
          type: "attorney",
          id: assignTo,
        },
      },
    ],
  };

  return `__ACTIONS__${JSON.stringify(actions)}__END_ACTIONS__`;
}

/**
 * Builds summary fields from extracted info arguments
 */
export function buildSummaryFields(args: {
  requestType?: string;
  location?: string;
  department?: string;
  urgency?: string;
  value?: number;
  summary?: string;
}): SummaryField[] {
  const fields: SummaryField[] = [];

  if (args.requestType) {
    fields.push({
      key: "requestType",
      label: "Request Type",
      value: args.requestType,
      editable: true,
    });
  }

  if (args.location) {
    fields.push({
      key: "location",
      label: "Location",
      value: args.location,
      editable: true,
    });
  }

  if (args.department) {
    fields.push({
      key: "department",
      label: "Department",
      value: args.department,
      editable: true,
    });
  }

  if (args.urgency) {
    fields.push({
      key: "urgency",
      label: "Urgency",
      value: args.urgency,
      editable: true,
    });
  }

  if (args.value) {
    fields.push({
      key: "value",
      label: "Value",
      value: args.value,
      editable: true,
    });
  }

  if (args.summary) {
    fields.push({
      key: "summary",
      label: "Summary",
      value: args.summary,
      editable: true,
    });
  }

  return fields;
}

/**
 * Builds a successful routing response
 */
export function buildSuccessResponse(
  decision: RoutingDecision,
  args: any
): string {
  const requestTypeFormatted = formatForDisplay(args.requestType);
  const summaryFields = buildSummaryFields(args);
  const summary = buildEditableSummary(summaryFields);
  const actions = buildActionButtons(
    decision.assignTo!,
    args.requestType,
    args.summary
  );

  return (
    `## ✅ We've got you covered!\n\n` +
    `Your request has been assigned to **${decision.assignTo}**.\n\n` +
    `**What happens next?**\n` +
    `${
      decision.assignTo
    } specializes in ${requestTypeFormatted.toLowerCase()} matters and will review your request soon. They'll reach out if they need any additional information.\n\n` +
    (decision.confidence && decision.confidence < 100
      ? `*This routing is based on the information provided (${decision.confidence}% match).*\n\n`
      : "") +
    summary +
    actions
  );
}

/**
 * Builds a clarification needed response
 */
export function buildClarificationResponse(
  decision: RoutingDecision,
  args: any
): string {
  const summaryFields = buildSummaryFields(args);
  const summary =
    summaryFields.length > 0
      ? buildEditableSummary(summaryFields) + "\n\n"
      : "";

  return (
    `## 🤔 Just need a bit more info\n\n` +
    summary +
    `${decision
      .needsClarification!.questions.map((q) => `${q}\n`)
      .join("")}\n\n` +
    `---`
  );
}

/**
 * Builds a fallback response when no rule matches
 */
export function buildFallbackResponse(args: any): string {
  const summaryFields = buildSummaryFields(args);
  const summary = buildEditableSummary(summaryFields);

  return (
    `## 👋 We'll take it from here\n\n` +
    `I couldn't find a specific team member for this request, but don't worry! I've forwarded it to our general legal team at **legal-general@acme.corp** who will make sure it gets to the right person.\n\n` +
    summary +
    `\n\nSomeone will be in touch shortly.\n\n` +
    `---`
  );
}
