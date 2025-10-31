export type RequestType =
  | "contracts"              // NDAs, customer agreements, vendor contracts
  | "employment_hr"          // Hiring, terminations, workplace issues
  | "litigation_disputes"    // Lawsuits, legal threats, disputes
  | "intellectual_property"  // Trademarks, patents, copyrights
  | "regulatory_compliance"  // Government rules, licenses, audits
  | "corporate_ma"           // Fundraising, acquisitions, equity/stock
  | "real_estate"            // Office leases, property matters
  | "privacy_data"           // GDPR, CCPA, data breaches
  | "general_advice";        // Not sure or doesn't fit above

export type Location =
  | "australia"
  | "united states"
  | "united kingdom"
  | "canada"
  | "europe"
  | "asia_pacific"
  | "other";

export type ConditionOperator =
  | "equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "not_equals";

export type ConditionField =
  | "requestType"
  | "location"
  | "value"
  | "department"
  | "urgency";

export interface Condition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string | number;
}

export interface RoutingAction {
  assignTo: string; // email address
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number; // Higher number = higher priority
  conditions: Condition[];
  action: RoutingAction;
  createdAt?: string;
  matchCount?: number; // For analytics
}

export interface RulesByAssignee {
  [email: string]: Rule[];
}
