import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRequestType } from "@/lib/formatters";
import { RequestType } from "@/types";

interface UIComponentData {
  type: "clarification_form";
  fields: string[];
  contextMessage: string;
  inferredRequestType?: string;
  options: {
    requestType?: Array<{ value: string; label: string; description: string }>;
    location?: Array<{ value: string; label: string }>;
  };
}

interface ClarificationFormProps {
  data: UIComponentData;
  onSubmit: (selections: {
    requestType?: string;
    location?: string;
    customDescription?: string;
  }) => void;
}

export function ClarificationForm({ data, onSubmit }: ClarificationFormProps) {
  const [selectedRequestType, setSelectedRequestType] = useState<
    string | undefined
  >(data.inferredRequestType);
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(
    undefined
  );
  const [useCustomDescription, setUseCustomDescription] = useState(false);
  const [customDescription, setCustomDescription] = useState("");

  const needsRequestType = data.fields.includes("requestType");
  const needsLocation = data.fields.includes("location");

  const canSubmit =
    (!needsRequestType ||
      selectedRequestType ||
      (useCustomDescription && customDescription.trim())) &&
    (!needsLocation || selectedLocation);

  const handleSubmit = () => {
    onSubmit({
      requestType: useCustomDescription ? undefined : selectedRequestType,
      location: selectedLocation,
      customDescription: useCustomDescription ? customDescription : undefined,
    });
  };

  return (
    <div className="border border-white/30 rounded-2xl p-4 bg-white/5 space-y-4 my-4">
      {data.contextMessage && (
        <p className="text-white/90 text-lg font-medium mb-4">
          {data.contextMessage}
        </p>
      )}

      {needsRequestType && data.options.requestType && (
        <div className="space-y-3 mt-4">
          {!useCustomDescription ? (
            <>
              <Label htmlFor="request-type" className="text-white/90">
                What type of legal request is this?
              </Label>
              <Select
                value={selectedRequestType}
                onValueChange={setSelectedRequestType}
              >
                <SelectTrigger id="request-type" className="w-full">
                  <SelectValue placeholder="Select request type...">
                    {formatRequestType(selectedRequestType as RequestType)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {data.options.requestType.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium text-white">
                          {type.label}
                        </span>
                        <span className="text-xs text-white/60">
                          {type.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setUseCustomDescription(true)}
                className="text-xs text-white/60 hover:text-white/90 underline"
              >
                Not sure? Describe your request instead
              </button>
            </>
          ) : (
            <>
              <Label htmlFor="custom-description" className="text-white/90">
                Describe your legal request
              </Label>
              <Input
                id="custom-description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="e.g., I need help with a vendor agreement..."
                className="bg-white/10 border-white/30 text-white placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={() => setUseCustomDescription(false)}
                className="text-xs text-white/60 hover:text-white/90 underline"
              >
                Choose from categories instead
              </button>
            </>
          )}
        </div>
      )}

      {needsLocation && data.options.location && (
        <div className="space-y-3">
          <Label className="text-white/90">What's your location?</Label>
          <div className="flex flex-wrap gap-2">
            {data.options.location.map((loc) => (
              <Badge
                key={loc.value}
                variant={selectedLocation === loc.value ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  selectedLocation === loc.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-white/10"
                }`}
                onClick={() => setSelectedLocation(loc.value)}
              >
                {loc.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          variant={"default"}
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="sm"
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
