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

// Import for use in this file
import { Condition } from "../../server/src/types";
