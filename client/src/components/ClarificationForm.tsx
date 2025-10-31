import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import type { RequestType, Location } from "@/types/rules";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_TYPE_DESCRIPTIONS,
} from "@/lib/formatters";

interface ClarificationField {
  name: string;
  required: boolean;
}

interface ClarificationFormProps {
  message: string;
  fields: ClarificationField[];
  onSubmit: (data: Record<string, any>) => void;
}

const REQUEST_TYPES: RequestType[] = [
  "contracts",
  "employment_hr",
  "litigation_disputes",
  "intellectual_property",
  "regulatory_compliance",
  "corporate_ma",
  "real_estate",
  "privacy_data",
  "general_advice",
];

const LOCATIONS: Location[] = [
  "australia",
  "united states",
  "united kingdom",
  "canada",
  "europe",
  "asia_pacific",
  "other",
];

export function ClarificationForm({
  message,
  fields,
  onSubmit,
}: ClarificationFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check required fields
    const requiredFields = fields.filter((f) => f.required);
    const allRequiredFilled = requiredFields.every((f) => formData[f.name]);

    if (allRequiredFilled) {
      onSubmit(formData);
    }
  };

  const formatLocation = (loc: string) => {
    return loc
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderField = (field: ClarificationField) => {
    const fieldName = field.name;

    if (fieldName === "requestType") {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            Request Type
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </label>
          <Select
            value={formData[fieldName] || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, [fieldName]: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex flex-col py-1">
                    <span className="font-medium">
                      {REQUEST_TYPE_LABELS[type]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {REQUEST_TYPE_DESCRIPTIONS[type]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (fieldName === "location") {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            Location
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </label>
          <Select
            value={formData[fieldName] || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, [fieldName]: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {formatLocation(loc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (fieldName === "value") {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            Contract Value
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              type="number"
              value={formData[fieldName] || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [fieldName]: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              placeholder="100000"
              className="pl-7"
            />
          </div>
        </div>
      );
    }

    if (fieldName === "department") {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            Department
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </label>
          <Input
            value={formData[fieldName] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [fieldName]: e.target.value })
            }
            placeholder="e.g., Engineering, Sales"
          />
        </div>
      );
    }

    if (fieldName === "urgency") {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            Urgency
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </label>
          <Select
            value={formData[fieldName] || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, [fieldName]: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select urgency..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-chart-4" />
                  Low - Can wait
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-chart-5" />
                  Medium - This week
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  High - Urgent
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    return null;
  };

  const requiredFields = fields.filter((f) => f.required);
  const allRequiredFilled = requiredFields.every((f) => formData[f.name]);

  return (
    <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
      <p className="text-sm">{message}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(renderField)}

        <Button type="submit" disabled={!allRequiredFilled} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Submit
        </Button>

        {!allRequiredFilled && (
          <p className="text-xs text-center text-muted-foreground">
            Please fill in all required fields
          </p>
        )}
      </form>
    </div>
  );
}
