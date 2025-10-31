import { Rule } from "./types";

export const seedRules: Rule[] = [
  {
    id: "rule-1",
    name: "US Contracts",
    description: "Standard contracts (NDAs, customer/vendor agreements) for US-based requests",
    enabled: true,
    priority: 1,
    conditions: [
      { field: "requestType", operator: "equals", value: "contracts" },
      { field: "location", operator: "equals", value: "united states" },
    ],
    action: { assignTo: "john.smith@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-2",
    name: "Australia Contracts",
    description: "Standard contracts for Australian-based requests",
    enabled: true,
    priority: 1,
    conditions: [
      { field: "requestType", operator: "equals", value: "contracts" },
      { field: "location", operator: "equals", value: "australia" },
    ],
    action: { assignTo: "jane.doe@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-3",
    name: "Global Employment/HR",
    description: "Employment matters (hiring, terminations, workplace issues)",
    enabled: true,
    priority: 1,
    conditions: [
      { field: "requestType", operator: "equals", value: "employment_hr" },
    ],
    action: { assignTo: "sarah.johnson@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-4",
    name: "High-Value Contracts (US)",
    description: "High-value contracts over $100k require senior attorney review",
    enabled: true,
    priority: 2, // Higher priority than rule-1
    conditions: [
      { field: "requestType", operator: "equals", value: "contracts" },
      { field: "location", operator: "equals", value: "united states" },
      { field: "value", operator: "greater_than", value: 100000 },
    ],
    action: { assignTo: "michael.chen@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-5",
    name: "Litigation & Disputes",
    description: "All litigation, lawsuits, and legal disputes",
    enabled: true,
    priority: 3, // High priority
    conditions: [
      { field: "requestType", operator: "equals", value: "litigation_disputes" }
    ],
    action: { assignTo: "robert.martinez@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-6",
    name: "Intellectual Property",
    description: "Trademarks, patents, copyrights, and IP protection",
    enabled: true,
    priority: 2,
    conditions: [
      { field: "requestType", operator: "equals", value: "intellectual_property" }
    ],
    action: { assignTo: "emily.wong@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-7",
    name: "Privacy & Data Protection (Europe)",
    description: "GDPR, data breaches, and privacy matters for European operations",
    enabled: true,
    priority: 2,
    conditions: [
      { field: "requestType", operator: "equals", value: "privacy_data" },
      { field: "location", operator: "equals", value: "europe" },
    ],
    action: { assignTo: "lisa.schmidt@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-8",
    name: "Corporate/M&A",
    description: "Fundraising, acquisitions, and equity/stock matters",
    enabled: true,
    priority: 2,
    conditions: [
      { field: "requestType", operator: "equals", value: "corporate_ma" }
    ],
    action: { assignTo: "david.lee@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-9",
    name: "Regulatory/Compliance",
    description: "Government regulations, licenses, and compliance audits",
    enabled: true,
    priority: 1,
    conditions: [
      { field: "requestType", operator: "equals", value: "regulatory_compliance" }
    ],
    action: { assignTo: "amanda.taylor@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
  {
    id: "rule-10",
    name: "General Legal Advice",
    description: "General questions or requests that don't fit other categories",
    enabled: true,
    priority: 0, // Lowest priority - catch-all
    conditions: [
      { field: "requestType", operator: "equals", value: "general_advice" }
    ],
    action: { assignTo: "legal-general@acme.corp" },
    createdAt: new Date().toISOString(),
    matchCount: 0,
  },
];
