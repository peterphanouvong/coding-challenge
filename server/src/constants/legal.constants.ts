/**
 * Shared constants for legal request types, locations, and urgency levels.
 * This is the single source of truth used across:
 * - OpenAI tool definitions
 * - Type definitions
 * - Frontend forms
 * - Validation logic
 */

export const REQUEST_TYPES = [
  "contracts",
  "employment_hr",
  "litigation_disputes",
  "intellectual_property",
  "regulatory_compliance",
  "corporate_ma",
  "real_estate",
  "privacy_data",
  "general_advice",
] as const;

export const LOCATIONS = [
  "australia",
  "united states",
  "united kingdom",
  "canada",
  "europe",
  "asia_pacific",
  "other",
] as const;

export const URGENCY_LEVELS = ["low", "medium", "high"] as const;

// Human-readable labels and descriptions for UI
export const REQUEST_TYPE_OPTIONS = [
  {
    value: "contracts",
    label: "Contracts & Agreements",
    description: "NDAs, vendor contracts, terms & conditions",
  },
  {
    value: "employment_hr",
    label: "Employment & HR",
    description: "Hiring, termination, workplace issues",
  },
  {
    value: "litigation_disputes",
    label: "Litigation & Disputes",
    description: "Lawsuits, legal threats, disputes",
  },
  {
    value: "intellectual_property",
    label: "Intellectual Property",
    description: "Patents, trademarks, copyrights",
  },
  {
    value: "regulatory_compliance",
    label: "Regulatory & Compliance",
    description: "Regulations, licenses, compliance",
  },
  {
    value: "corporate_ma",
    label: "Corporate & M&A",
    description: "Fundraising, acquisitions, investments",
  },
  {
    value: "real_estate",
    label: "Real Estate",
    description: "Property, leases, office space",
  },
  {
    value: "privacy_data",
    label: "Privacy & Data",
    description: "Data privacy, GDPR, security breaches",
  },
  {
    value: "general_advice",
    label: "General Legal Advice",
    description: "General questions or unclear requests",
  },
] as const;

export const LOCATION_OPTIONS = [
  { value: "australia", label: "Australia" },
  { value: "united states", label: "United States" },
  { value: "united kingdom", label: "United Kingdom" },
  { value: "canada", label: "Canada" },
  { value: "europe", label: "Europe" },
  { value: "asia_pacific", label: "Asia Pacific" },
  { value: "other", label: "Other" },
] as const;
