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
import { ChevronDown, ChevronUp, Send, Sparkles } from "lucide-react";
import type { RequestType, Location } from "@/types/rules";
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_DESCRIPTIONS } from "@/lib/formatters";

interface RequestFormData {
  requestType: RequestType | "";
  location: Location | "";
  description: string;
  value?: number;
  department?: string;
  urgency?: "low" | "medium" | "high";
}

interface RequestFormProps {
  onSubmit: (data: RequestFormData) => void;
  isLoading: boolean;
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

export function RequestForm({ onSubmit, isLoading }: RequestFormProps) {
  const [formData, setFormData] = useState<RequestFormData>({
    requestType: "",
    location: "",
    description: "",
  });

  const [showOptional, setShowOptional] = useState(false);

  const canSubmit =
    formData.requestType &&
    formData.location &&
    formData.description.trim().length > 0 &&
    !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit(formData);
    }
  };

  const formatLocation = (loc: string) => {
    return loc
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Template Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">New Legal Request</h3>
      </div>

      {/* Required Fields */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="destructive" className="text-xs">Required</Badge>
          <span className="text-sm text-muted-foreground">
            Fill in these fields to route your request
          </span>
        </div>

        {/* Request Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            What type of legal help do you need? *
          </label>
          <Select
            value={formData.requestType}
            onValueChange={(value: RequestType) =>
              setFormData({ ...formData, requestType: value })
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select request type..." />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex flex-col py-1">
                    <span className="font-medium">{REQUEST_TYPE_LABELS[type]}</span>
                    <span className="text-xs text-muted-foreground">
                      {REQUEST_TYPE_DESCRIPTIONS[type]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Where are you located? *
          </label>
          <Select
            value={formData.location}
            onValueChange={(value: Location) =>
              setFormData({ ...formData, location: value })
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your location..." />
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
          <label className="text-sm font-medium">
            Describe your request *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="e.g., I need help reviewing a vendor contract for our new supplier..."
            className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Provide details about your legal request so we can route you to the right attorney
          </p>
        </div>
      </div>

      {/* Optional Fields - Expandable */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Optional</Badge>
            <span className="text-sm font-medium">
              Additional details (help us prioritize)
            </span>
          </div>
          {showOptional ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showOptional && (
          <div className="p-4 pt-0 space-y-4 bg-muted/10">
            {/* Contract Value */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Contract Value (if applicable)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={formData.value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="100000"
                  className="pl-7"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                For contracts or M&A - helps route high-value deals to senior attorneys
              </p>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Input
                type="text"
                value={formData.department || ""}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="e.g., Engineering, Sales, Marketing"
                disabled={isLoading}
              />
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Urgency Level</label>
              <Select
                value={formData.urgency || ""}
                onValueChange={(value: "low" | "medium" | "high") =>
                  setFormData({ ...formData, urgency: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select urgency..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Low - Can wait a few days
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Medium - Need response this week
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      High - Urgent, need immediate attention
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!canSubmit}
      >
        {isLoading ? (
          <>
            <span className="animate-pulse">Routing your request...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Submit Request
          </>
        )}
      </Button>

      {!canSubmit && !isLoading && (
        <p className="text-sm text-center text-muted-foreground">
          Please fill in all required fields (*)
        </p>
      )}
    </form>
  );
}
