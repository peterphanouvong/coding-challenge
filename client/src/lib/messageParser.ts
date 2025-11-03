/**
 * Message parsing utilities
 * Extracts UI components, actions, and summaries from streaming responses
 */

export interface UIComponentData {
  type: "clarification_form";
  fields: string[];
  contextMessage: string;
  inferredRequestType?: string;
  options: {
    requestType?: Array<{ value: string; label: string; description: string }>;
    location?: Array<{ value: string; label: string }>;
  };
}

export interface ActionButton {
  type: "email" | "link" | "copy";
  label: string;
  email?: string;
  subject?: string;
  body?: string;
  url?: string;
  copyText?: string;
}

export interface ActionData {
  type: "action_buttons";
  actions: ActionButton[];
}

export interface SummaryField {
  key: string;
  label: string;
  value: string | number;
  editable: boolean;
}

export interface SummaryData {
  type: "editable_summary";
  fields: SummaryField[];
}

export interface ParsedComponents {
  uiComponent?: UIComponentData;
  actions?: ActionData;
  summary?: SummaryData;
  cleanedContent: string;
}

/**
 * Parse UI component markers from message content
 */
function parseUIComponent(content: string): UIComponentData | undefined {
  const match = content.match(/__UI_COMPONENT__(.*?)__END_UI__/s);
  if (!match) return undefined;

  try {
    return JSON.parse(match[1]) as UIComponentData;
  } catch (error) {
    console.error("Error parsing UI component:", error);
    return undefined;
  }
}

/**
 * Parse action button markers from message content
 */
function parseActions(content: string): ActionData | undefined {
  const match = content.match(/__ACTIONS__(.*?)__END_ACTIONS__/s);
  if (!match) return undefined;

  try {
    return JSON.parse(match[1]) as ActionData;
  } catch (error) {
    console.error("Error parsing actions:", error);
    return undefined;
  }
}

/**
 * Parse summary markers from message content
 */
function parseSummary(content: string): SummaryData | undefined {
  const match = content.match(/__SUMMARY__(.*?)__END_SUMMARY__/s);
  if (!match) return undefined;

  try {
    return JSON.parse(match[1]) as SummaryData;
  } catch (error) {
    console.error("Error parsing summary:", error);
    return undefined;
  }
}

/**
 * Clean markers from content
 */
function cleanMarkers(content: string): string {
  return content
    .replace(/__UI_COMPONENT__.*?__END_UI__/gs, "")
    .replace(/__ACTIONS__.*?__END_ACTIONS__/gs, "")
    .replace(/__SUMMARY__.*?__END_SUMMARY__/gs, "");
}

/**
 * Parse all components from message content
 */
export function parseMessageComponents(content: string): ParsedComponents {
  const uiComponent = parseUIComponent(content);
  const actions = parseActions(content);
  const summary = parseSummary(content);
  const cleanedContent = cleanMarkers(content);

  return {
    uiComponent,
    actions,
    summary,
    cleanedContent,
  };
}
