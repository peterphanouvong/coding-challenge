import type { RequestType } from "../../../server/src/types";
import { REQUEST_TYPE_OPTIONS } from "../../../server/src/constants/legal.constants";

const REQUEST_TYPE_LABELS: Record<RequestType, string> =
  REQUEST_TYPE_OPTIONS.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {} as Record<RequestType, string>);

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

export function formatConditionValue(
  field: string,
  value: string | number
): string {
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
