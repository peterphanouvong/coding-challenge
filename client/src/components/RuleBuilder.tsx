import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRequestType } from "@/lib/formatters";
import { RequestType } from "@/types";
import type {
  Condition,
  ConditionField,
  ConditionOperator,
} from "@/types/rules";
import { Plus, X } from "lucide-react";

interface RuleBuilderProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
}

const FIELD_OPTIONS: { value: ConditionField; label: string }[] = [
  { value: "requestType", label: "Request Type" },
  { value: "location", label: "Location" },
  { value: "value", label: "Contract Value" },
  { value: "department", label: "Department" },
  { value: "urgency", label: "Urgency" },
];

const OPERATOR_OPTIONS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
];

export const REQUEST_TYPE_VALUES: {
  value: RequestType;
  label: string;
  description: string;
}[] = [
  {
    value: "contracts",
    label: "Contracts",
    description: "NDAs, customer agreements, vendor contracts",
  },
  {
    value: "employment_hr",
    label: "Employment/HR",
    description: "Hiring, terminations, workplace issues",
  },
  {
    value: "litigation_disputes",
    label: "Litigation/Disputes",
    description: "Lawsuits, legal threats, disputes",
  },
  {
    value: "intellectual_property",
    label: "Intellectual Property",
    description: "Trademarks, patents, copyrights",
  },
  {
    value: "regulatory_compliance",
    label: "Regulatory/Compliance",
    description: "Government rules, licenses, audits",
  },
  {
    value: "corporate_ma",
    label: "Corporate/M&A",
    description: "Fundraising, acquisitions, equity/stock",
  },
  {
    value: "real_estate",
    label: "Real Estate",
    description: "Office leases, property matters",
  },
  {
    value: "privacy_data",
    label: "Privacy/Data Protection",
    description: "GDPR, CCPA, data breaches",
  },
  {
    value: "general_advice",
    label: "General Advice",
    description: "Not sure or doesn't fit above",
  },
];

export const LOCATION_VALUES: { value: string; label: string }[] = [
  { value: "australia", label: "Australia" },
  { value: "united states", label: "United States" },
  { value: "united kingdom", label: "United Kingdom" },
  { value: "canada", label: "Canada" },
  { value: "europe", label: "Europe" },
  { value: "asia_pacific", label: "Asia Pacific" },
  { value: "other", label: "Other" },
];

export const URGENCY_VALUES = ["low", "medium", "high"];

export function RuleBuilder({ conditions, onChange }: RuleBuilderProps) {
  const addCondition = () => {
    onChange([
      ...conditions,
      {
        field: "requestType",
        operator: "equals",
        value: "",
      },
    ]);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange(newConditions);
  };

  const getValueInput = (condition: Condition, index: number) => {
    // For requestType, location, urgency - use select
    if (condition.field === "requestType") {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) => updateCondition(index, { value })}
        >
          <SelectTrigger className="min-w-[220px]">
            <SelectValue placeholder="Select type...">
              {formatRequestType(String(condition.value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {REQUEST_TYPE_VALUES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {type.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (condition.field === "location") {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) => updateCondition(index, { value })}
        >
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="Select location..." />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_VALUES.map((loc) => (
              <SelectItem key={loc.value} value={loc.value}>
                {loc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (condition.field === "urgency") {
      return (
        <Select
          value={String(condition.value)}
          onValueChange={(value) => updateCondition(index, { value })}
        >
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="Select urgency..." />
          </SelectTrigger>
          <SelectContent>
            {URGENCY_VALUES.map((urg) => (
              <SelectItem key={urg} value={urg}>
                {urg.charAt(0).toUpperCase() + urg.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For value field - number input
    if (condition.field === "value") {
      return (
        <Input
          type="number"
          value={condition.value}
          onChange={(e) =>
            updateCondition(index, { value: Number(e.target.value) })
          }
          placeholder="Enter amount..."
          className="min-w-[180px]"
        />
      );
    }

    // For department and other text fields
    return (
      <Input
        type="text"
        value={condition.value}
        onChange={(e) => updateCondition(index, { value: e.target.value })}
        placeholder="Enter value..."
        className="min-w-[180px]"
      />
    );
  };

  return (
    <div className="space-y-3">
      {conditions.map((condition, index) => (
        <div
          key={index}
          className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border"
        >
          <span className="text-sm text-muted-foreground font-medium">
            {index === 0 ? "Where" : "And"}
          </span>

          <Select
            value={condition.field}
            onValueChange={(field: ConditionField) =>
              updateCondition(index, { field, value: "" })
            }
          >
            <SelectTrigger className="min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={condition.operator}
            onValueChange={(operator: ConditionOperator) =>
              updateCondition(index, { operator })
            }
          >
            <SelectTrigger className="min-w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATOR_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {getValueInput(condition, index)}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeCondition(index)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addCondition}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add condition
      </Button>
    </div>
  );
}
