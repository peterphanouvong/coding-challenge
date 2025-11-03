import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Location, RequestType } from "../../../server/src/types";
import { ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import { useState } from "react";

import {
  LOCATIONS,
  REQUEST_TYPE_OPTIONS,
} from "../../../server/src/constants/legal.constants";

interface TemplateData {
  requestType: RequestType | "";
  location: Location | "";
  description: string;
  value?: number;
  department?: string;
  urgency?: "low" | "medium" | "high";
}

interface RequestTemplateProps {
  onUseTemplate: (message: string) => void;
  onClose: () => void;
}

export function RequestTemplate({
  onUseTemplate,
  onClose,
}: RequestTemplateProps) {
  const [data, setData] = useState<TemplateData>({
    requestType: "",
    location: "",
    description: "",
  });

  const [showOptional, setShowOptional] = useState(false);

  const canUse = data.requestType && data.location && data.description.trim();

  const handleUseTemplate = () => {
    if (!canUse) return;

    // Build structured message
    let message = `I need help with a ${data.requestType} request.\n\n`;
    message += `Location: ${data.location}\n\n`;
    message += `Description: ${data.description}`;

    if (data.value) {
      message += `\n\nContract Value: $${data.value.toLocaleString()}`;
    }

    if (data.department) {
      message += `\n\nDepartment: ${data.department}`;
    }

    if (data.urgency) {
      message += `\n\nUrgency: ${data.urgency}`;
    }

    onUseTemplate(message);
  };

  const formatLocation = (loc: string) => {
    return loc
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="border rounded-lg bg-card shadow-lg max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Request Template</h3>
          <Badge variant="secondary" className="text-xs">
            Structured Input
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <p className="text-sm text-muted-foreground">
          Fill in the fields below to create a structured legal request
        </p>

        {/* Required Fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          </div>

          {/* Request Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Request Type *</label>
            <Select
              value={data.requestType}
              onValueChange={(value: RequestType) =>
                setData({ ...data, requestType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Location *</label>
            <Select
              value={data.location}
              onValueChange={(value: Location) =>
                setData({ ...data, location: value })
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

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
              placeholder="Describe your legal request..."
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Optional
              </Badge>
              <span className="text-sm font-medium">Additional details</span>
            </div>
            {showOptional ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showOptional && (
            <div className="p-3 pt-0 space-y-3 bg-muted/10">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contract Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    value={data.value || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        value: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="100000"
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={data.department || ""}
                  onChange={(e) =>
                    setData({ ...data, department: e.target.value })
                  }
                  placeholder="e.g., Engineering, Sales"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency</label>
                <Select
                  value={data.urgency || ""}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setData({ ...data, urgency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Can wait</SelectItem>
                    <SelectItem value="medium">Medium - This week</SelectItem>
                    <SelectItem value="high">High - Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/20">
        <Button
          onClick={handleUseTemplate}
          disabled={!canUse}
          className="w-full"
          size="lg"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Use Template
        </Button>
        {!canUse && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Please fill in all required fields (*)
          </p>
        )}
      </div>
    </div>
  );
}
