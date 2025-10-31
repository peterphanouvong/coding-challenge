import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ActionButton {
  type: "email" | "link" | "copy";
  label: string;
  email?: string;
  subject?: string;
  body?: string;
  url?: string;
  copyText?: string;
}

interface ActionData {
  type: "action_buttons";
  actions: ActionButton[];
}

interface ActionButtonsProps {
  data: ActionData;
}

export function ActionButtons({ data }: ActionButtonsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAction = (action: ActionButton, index: number) => {
    switch (action.type) {
      case "email":
        if (action.email) {
          const mailtoUrl = `mailto:${action.email}${
            action.subject ? `?subject=${encodeURIComponent(action.subject)}` : ""
          }${
            action.body
              ? `${action.subject ? "&" : "?"}body=${encodeURIComponent(
                  action.body
                )}`
              : ""
          }`;
          window.location.href = mailtoUrl;
        }
        break;

      case "link":
        if (action.url) {
          window.open(action.url, "_blank", "noopener,noreferrer");
        }
        break;

      case "copy":
        if (action.copyText) {
          navigator.clipboard.writeText(action.copyText);
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 2000);
        }
        break;
    }
  };

  const getIcon = (type: string, index: number) => {
    if (type === "copy" && copiedIndex === index) {
      return <Check className="h-4 w-4 mr-2" />;
    }

    switch (type) {
      case "email":
        return <Mail className="h-4 w-4 mr-2" />;
      case "link":
        return <ExternalLink className="h-4 w-4 mr-2" />;
      case "copy":
        return <Copy className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {data.actions.map((action, index) => (
        <Button
          key={index}
          onClick={() => handleAction(action, index)}
          variant="secondary"
          size="sm"
          className="bg-white/10 hover:bg-white/20 border border-white/30"
        >
          {getIcon(action.type, index)}
          {action.type === "copy" && copiedIndex === index
            ? "Copied!"
            : action.label}
        </Button>
      ))}
    </div>
  );
}
