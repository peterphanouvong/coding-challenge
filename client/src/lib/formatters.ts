import type { RequestType } from "@/types/rules";

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  contracts: "Contracts",
  employment_hr: "Employment/HR",
  litigation_disputes: "Litigation/Disputes",
  intellectual_property: "Intellectual Property",
  regulatory_compliance: "Regulatory/Compliance",
  corporate_ma: "Corporate/M&A",
  real_estate: "Real Estate",
  privacy_data: "Privacy/Data Protection",
  general_advice: "General Advice",
};

export const REQUEST_TYPE_DESCRIPTIONS: Record<RequestType, string> = {
  contracts: "NDAs, customer agreements, vendor contracts",
  employment_hr: "Hiring, terminations, workplace issues",
  litigation_disputes: "Lawsuits, legal threats, disputes",
  intellectual_property: "Trademarks, patents, copyrights",
  regulatory_compliance: "Government rules, licenses, audits",
  corporate_ma: "Fundraising, acquisitions, equity/stock",
  real_estate: "Office leases, property matters",
  privacy_data: "GDPR, CCPA, data breaches",
  general_advice: "Not sure or doesn't fit above",
};

export function formatRequestType(type: string): string {
  return REQUEST_TYPE_LABELS[type as RequestType] || type;
}

export function formatLocation(location: string): string {
  return location
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatFieldName(field: string): string {
  const fieldLabels: Record<string, string> = {
    requestType: "Request Type",
    location: "Location",
    value: "Contract Value",
    department: "Department",
    urgency: "Urgency",
  };

  return fieldLabels[field] || field;
}

export function formatOperator(operator: string): string {
  const operatorLabels: Record<string, string> = {
    equals: "equals",
    contains: "contains",
    greater_than: "greater than",
    less_than: "less than",
    not_equals: "not equals",
  };

  return operatorLabels[operator] || operator;
}

export function formatConditionValue(field: string, value: string | number): string {
  if (field === "requestType") {
    return formatRequestType(String(value));
  }

  if (field === "location") {
    return formatLocation(String(value));
  }

  if (field === "value" && typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  if (field === "urgency") {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

  return String(value);
}
