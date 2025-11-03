// Re-export server types for client use
export type {
  Rule,
  Condition,
  ConditionField,
  ConditionOperator,
  RoutingDecision,
  ExtractedInfo,
  ChatMessage,
  RequestType,
  Location,
} from "../../server/src/types";

// Import for use in this file
import { Condition, Rule } from "../../server/src/types";

// Client-specific types
export interface RuleFormData {
  name: string;
  description?: string;
  conditions: Condition[];
  assignTo: string;
  priority: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export type RulesByAssignee = Record<string, Rule[]>;
