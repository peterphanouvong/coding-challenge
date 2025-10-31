import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { REQUEST_TYPE_VALUES, LOCATION_VALUES } from "./RuleBuilder";
import type { RequestType, Location } from "@/types";

interface SummaryField {
  key: string;
  label: string;
  value: string | number;
  editable: boolean;
  type?: "text" | "number" | "select";
  options?: Array<{ value: string; label: string }>;
}

interface SummaryData {
  type: "editable_summary";
  fields: SummaryField[];
}

interface EditableSummaryProps {
  data: SummaryData;
  onRetry: (updatedFields: Record<string, string | number>) => void;
}

export function EditableSummary({ data, onRetry }: EditableSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<
    Record<string, string | number>
  >(
    data.fields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, string | number>)
  );

  const handleFieldChange = (key: string, value: string | number) => {
    setEditedFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleRetry = () => {
    onRetry(editedFields);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedFields(
      data.fields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {} as Record<string, string | number>)
    );
    setIsEditing(false);
  };

  const formatFieldValue = (field: SummaryField) => {
    if (field.key === "requestType") {
      const typeInfo = REQUEST_TYPE_VALUES.find((t) => t.value === field.value);
      return typeInfo?.label || String(field.value);
    }
    if (field.key === "location") {
      const locInfo = LOCATION_VALUES.find((l) => l.value === field.value);
      return locInfo?.label || String(field.value);
    }
    if (field.key === "value" && typeof field.value === "number") {
      return `$${field.value.toLocaleString()}`;
    }
    return String(field.value);
  };

  return (
    <div className="border border-white/30 rounded-2xl p-4 bg-white/5 space-y-3 my-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white/90 font-medium text-sm">
          Information Captured
        </h3>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white/90 h-8"
          >
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {data.fields.map((field) => {
            if (!field.editable) {
              return (
                <div key={field.key} className="space-y-1">
                  <Label className="text-white/70 text-xs">{field.label}</Label>
                  <p className="text-white/90 text-sm">
                    {formatFieldValue(field)}
                  </p>
                </div>
              );
            }

            if (field.key === "requestType") {
              return (
                <div key={field.key} className="space-y-1">
                  <Label
                    htmlFor={`edit-${field.key}`}
                    className="text-white/70 text-xs"
                  >
                    {field.label}
                  </Label>
                  <Select
                    value={String(editedFields[field.key])}
                    onValueChange={(value) =>
                      handleFieldChange(field.key, value)
                    }
                  >
                    <SelectTrigger id={`edit-${field.key}`} className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_TYPE_VALUES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (field.key === "location") {
              return (
                <div key={field.key} className="space-y-1">
                  <Label className="text-white/70 text-xs">{field.label}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {LOCATION_VALUES.map((loc) => (
                      <Badge
                        key={loc.value}
                        variant={
                          editedFields[field.key] === loc.value
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer transition-all text-xs ${
                          editedFields[field.key] === loc.value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-white/10"
                        }`}
                        onClick={() => handleFieldChange(field.key, loc.value)}
                      >
                        {loc.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={field.key} className="space-y-1">
                <Label
                  htmlFor={`edit-${field.key}`}
                  className="text-white/70 text-xs"
                >
                  {field.label}
                </Label>
                <Input
                  id={`edit-${field.key}`}
                  type={field.type || "text"}
                  value={String(editedFields[field.key])}
                  onChange={(e) =>
                    handleFieldChange(
                      field.key,
                      field.type === "number"
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/40 h-9 text-sm"
                />
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleRetry} size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry with Changes
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="border-white/30"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.fields.map((field) => (
            <div key={field.key} className="flex items-baseline gap-2">
              <span className="text-white/60 text-sm">{field.label}:</span>
              <span className="text-white/90 text-sm font-medium">
                {formatFieldValue(field)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
