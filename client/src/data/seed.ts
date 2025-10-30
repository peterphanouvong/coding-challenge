export const seedRules = [
  {
    id: "rule-1",
    name: "AU Employment Contracts",
    enabled: true,
    priority: 1,
    conditions: [
      { field: "requestType", operator: "equals", value: "employment" },
      { field: "location", operator: "equals", value: "australia" },
    ],
    action: { assignTo: "john@acme.corp" },
    description: "Employment contracts for Australian employees",
  },
  {
    id: "rule-2",
    name: "US Employment Contracts",
    enabled: true,
    priority: 1,
    conditions: [
      { field: "requestType", operator: "equals", value: "employment" },
      { field: "location", operator: "equals", value: "united states" },
    ],
    action: { assignTo: "jane@acme.corp" },
    description: "Employment contracts for US employees",
  },
  {
    id: "rule-3",
    name: "AU Sales Contracts",
    enabled: true,
    priority: 1,
    conditions: [
      { field: "requestType", operator: "equals", value: "sales" },
      { field: "location", operator: "equals", value: "australia" },
    ],
    action: { assignTo: "sarah@acme.corp" },
    description: "Sales contracts for Australian clients",
  },
  {
    id: "rule-4",
    name: "AU High-Value Sales",
    enabled: true,
    priority: 2, // Higher priority than rule-3
    conditions: [
      { field: "requestType", operator: "equals", value: "sales" },
      { field: "location", operator: "equals", value: "australia" },
      { field: "value", operator: "greater_than", value: 50000 },
    ],
    action: { assignTo: "sarah@acme.corp" },
    description: "High-value sales contracts require senior review",
  },
  {
    id: "rule-5",
    name: "NDA Requests",
    enabled: true,
    priority: 1,
    conditions: [{ field: "requestType", operator: "equals", value: "nda" }],
    action: { assignTo: "legal-general@acme.corp" },
    description: "All NDA requests go to general legal team",
  },
];

export const testMessages = [
  // Simple match
  "I need an employment contract reviewed, I'm in Sydney",

  // Needs clarification
  "I need help with a contract",

  // High-value match
  "Need sales contract reviewed for $80k deal in Australia",

  // No match
  "I need a partnership agreement reviewed, based in Canada",

  // Fuzzy match
  "hey got a job offer contract, im in melb",

  // NDA (location-independent)
  "Need an NDA signed",

  // Multiple possible types
  "I have a contractor agreement that needs review",
];
