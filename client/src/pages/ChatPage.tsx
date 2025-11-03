import { ActionButtons } from "@/components/ActionButtons";
import { ClarificationForm } from "@/components/ClarificationForm";
import { EditableSummary } from "@/components/EditableSummary";
import {
  LOCATION_VALUES,
  REQUEST_TYPE_VALUES,
  URGENCY_VALUES,
} from "@/components/RuleBuilder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRequestType } from "@/lib/formatters";
import { Location, RequestType } from "@/types";
import { BookIcon, CornerDownRightIcon, PlusIcon, X } from "lucide-react";
import Markdown from "markdown-to-jsx";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8999";

type Role = "user" | "assistant";

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

interface SummaryField {
  key: string;
  label: string;
  value: string | number;
  editable: boolean;
}

interface SummaryData {
  type: "editable_summary";
  fields: SummaryField[];
}

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  uiComponent?: UIComponentData;
  actions?: ActionData;
  summary?: SummaryData;
}

const createMessage = (overrides?: Partial<ChatMessage>): ChatMessage => ({
  id: Math.random().toString(36).slice(2),
  role: "assistant",
  content: "",
  ...overrides,
});

// Example prompts to help users get started
const EXAMPLE_PROMPTS = [
  {
    description:
      "I need help reviewing an employment contract for a new hire in Australia",
  },
  {
    description:
      "We need an NDA for a new vendor partnership in the United States",
  },
  {
    description:
      "I have questions about trademark protection for our new product in Europe",
  },
  {
    description: "Need guidance on GDPR compliance for our European customers",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [selectedRequestType, setSelectedRequestType] =
    useState<RequestType | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  const [selectedUrgency, setSelectedUrgency] = useState<
    "low" | "medium" | "high" | null
  >(null);

  const canSubmit = useMemo(
    () =>
      (input.trim().length > 0 && !isStreaming) ||
      (showTemplate && !isStreaming),
    [input, isStreaming, showTemplate]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowTemplate(false); // Disable template when using a suggestion
    // Focus on the input field
    const inputElement = document.getElementById(
      "chat-input"
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleClarificationSubmit = (selections: {
    requestType?: string;
    location?: string;
    customDescription?: string;
  }) => {
    // Format the selections into a user message
    const parts: string[] = [];

    if (selections.customDescription) {
      parts.push(selections.customDescription);
    } else if (selections.requestType) {
      const formatted = selections.requestType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      parts.push(`Request type: ${formatted}`);
    }

    if (selections.location) {
      const formatted = selections.location
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      parts.push(`Location: ${formatted}`);
    }

    // Create artificial form submit event
    const artificialInput = parts.join(", ");
    setInput(artificialInput);

    // Trigger submission
    setTimeout(() => {
      const form = document.querySelector(".chat-input") as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 0);
  };

  const handleSummaryRetry = (
    updatedFields: Record<string, string | number>
  ) => {
    // Format the updated fields into a user message
    const parts: string[] = [];

    if (updatedFields.requestType) {
      const formatted = String(updatedFields.requestType)
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      parts.push(`Request type: ${formatted}`);
    }

    if (updatedFields.location) {
      const formatted = String(updatedFields.location)
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      parts.push(`Location: ${formatted}`);
    }

    if (updatedFields.department) {
      parts.push(`Department: ${updatedFields.department}`);
    }

    if (updatedFields.urgency) {
      parts.push(`Urgency: ${updatedFields.urgency}`);
    }

    if (updatedFields.value) {
      parts.push(`Value: $${updatedFields.value}`);
    }

    if (updatedFields.summary) {
      parts.push(`Summary: ${updatedFields.summary}`);
    }

    // Create artificial form submit event
    const artificialInput = parts.join(", ");
    setInput(artificialInput);

    // Trigger submission
    setTimeout(() => {
      const form = document.querySelector(".chat-input") as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userText = showTemplate
      ? `I have a request about ${selectedRequestType} of ${selectedUrgency} urgency. My location is ${selectedLocation}`
      : input.trim();

    if (!userText || isStreaming) {
      return;
    }

    const userMessage = createMessage({ role: "user", content: userText });
    const assistantMessage = createMessage({ role: "assistant", content: "" });

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setError(null);
    setIsStreaming(true);
    setShowTemplate(false);

    const conversation = [...messages, { role: "user", content: userText }]
      .map(({ role, content }) => ({ role, content }))
      .filter(
        (message): message is { role: Role; content: string } =>
          typeof message.role === "string" &&
          typeof message.content === "string"
      );

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: conversation }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to chat service");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        if (value) {
          assistantText += decoder.decode(value, { stream: true });

          // Check for UI component markers
          const uiComponentMatch = assistantText.match(
            /__UI_COMPONENT__(.*?)__END_UI__/s
          );

          // Check for action button markers
          const actionsMatch = assistantText.match(
            /__ACTIONS__(.*?)__END_ACTIONS__/s
          );

          // Check for summary markers
          const summaryMatch = assistantText.match(
            /__SUMMARY__(.*?)__END_SUMMARY__/s
          );

          let hasUpdate = false;
          const updates: Partial<ChatMessage> = {};

          if (uiComponentMatch) {
            try {
              const uiComponentData = JSON.parse(
                uiComponentMatch[1]
              ) as UIComponentData;

              updates.uiComponent = uiComponentData;

              // Remove the UI component marker from the text
              assistantText = assistantText.replace(
                /__UI_COMPONENT__.*?__END_UI__/s,
                ""
              );
              hasUpdate = true;
            } catch (parseError) {
              console.error("Error parsing UI component:", parseError);
            }
          }

          if (actionsMatch) {
            try {
              const actionData = JSON.parse(actionsMatch[1]) as ActionData;

              updates.actions = actionData;

              // Remove the actions marker from the text
              assistantText = assistantText.replace(
                /__ACTIONS__.*?__END_ACTIONS__/s,
                ""
              );
              hasUpdate = true;
            } catch (parseError) {
              console.error("Error parsing actions:", parseError);
            }
          }

          if (summaryMatch) {
            try {
              const summaryData = JSON.parse(summaryMatch[1]) as SummaryData;

              updates.summary = summaryData;

              // Remove the summary marker from the text
              assistantText = assistantText.replace(
                /__SUMMARY__.*?__END_SUMMARY__/s,
                ""
              );
              hasUpdate = true;
            } catch (parseError) {
              console.error("Error parsing summary:", parseError);
            }
          }

          // Update message with any parsed components and cleaned content
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    content: assistantText,
                    ...updates,
                  }
                : message
            )
          );
        }
      }

      assistantText += decoder.decode();

      // Final update (in case there's any remaining content)
      // Clean up any markers that might remain
      const cleanedContent = assistantText
        .replace(/__UI_COMPONENT__.*?__END_UI__/gs, "")
        .replace(/__ACTIONS__.*?__END_ACTIONS__/gs, "")
        .replace(/__SUMMARY__.*?__END_SUMMARY__/gs, "");

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: cleanedContent,
              }
            : message
        )
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong";
      console.error(caughtError);
      setError(message);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantMessage.id)
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="chat-page">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-2 pt-32">
            <h1 className="text-4xl md:text-5xl font-semibold text-white/90">
              Legal Frontdoor
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Connect with the right attorney for your legal needs
            </p>
          </div>
        </div>
      ) : (
        <div className="chat-window">
          {messages.map((message) => (
            <div key={message.id} className={`message message-${message.role}`}>
              <span className="message-role">
                {message.role === "user" ? "You" : "Assistant"}
              </span>
              <div
                className="prose prose-invert"
                style={{ whiteSpace: "pre-wrap" }}
              >
                <Markdown>
                  {message.content ||
                    (message.role === "assistant" && isStreaming ? "…" : "")}
                </Markdown>
              </div>
              {message.uiComponent && (
                <ClarificationForm
                  data={message.uiComponent}
                  onSubmit={handleClarificationSubmit}
                />
              )}
              {message.summary && (
                <EditableSummary
                  data={message.summary}
                  onRetry={handleSummaryRetry}
                />
              )}
              {message.actions && <ActionButtons data={message.actions} />}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {error && <div className="chat-error">{error}</div>}

      <form
        className="chat-input flex-col border border-white/30 rounded-2xl p-2 shadow-[0px_8px_15px_0px_rgba(71,85,105,0.25)]"
        onSubmit={handleSubmit}
      >
        {showTemplate ? (
          <div className="rounded-xl px-4 py-1 flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <p className="">I have a request about </p>
              <div>
                <Select
                  value={selectedRequestType || undefined}
                  onValueChange={(value) =>
                    setSelectedRequestType(value as RequestType)
                  }
                >
                  <SelectTrigger className="min-w-[220px]">
                    <SelectValue placeholder="Select type...">
                      {formatRequestType(String(selectedRequestType))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPE_VALUES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col items-start">
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
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <p className="">Of</p>
              <div>
                <Select
                  value={selectedUrgency || undefined}
                  onValueChange={(value) =>
                    setSelectedUrgency(value as "low" | "medium" | "high")
                  }
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
              </div>
              <p>urgency</p>
            </div>

            <div className="flex gap-4 items-center">
              <p className="">My location is </p>
              <div>
                <Select
                  value={selectedLocation || undefined}
                  onValueChange={(value) =>
                    setSelectedLocation(value as Location)
                  }
                >
                  <SelectTrigger className="min-w-[220px]">
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
              </div>
            </div>
          </div>
        ) : (
          <Input
            id="chat-input"
            className="ring-0 bg-transparent border-none focus-visible:ring-0"
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="What legal request do you have?"
            disabled={isStreaming}
          />
        )}

        <div className="flex justify-between items-center px-2 py-2">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant={showSuggestions ? "secondary" : "ghost"}
                    onClick={() => setShowSuggestions(!showSuggestions)}
                  >
                    <BookIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Suggestions</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {showTemplate && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 pl-3 h-9 rounded-md"
                onClick={() => setShowTemplate(false)}
              >
                <span className="text-xs">Template</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          <Button type="submit" disabled={!canSubmit}>
            {isStreaming ? "Thinking…" : "Send"}
          </Button>
        </div>
      </form>

      {/* Example Prompts - Show when not streaming and suggestions are enabled */}
      {!isStreaming && showSuggestions && (
        <Card className="space-y-3 rounded-2xl pb-2 border-none">
          <div className="p-4 px-6 pb-0 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white/70 font-medium text-sm">
              <CornerDownRightIcon className="h-4 w-4" />
              <span>Suggestions</span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setShowSuggestions(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 px-3">
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(prompt.description)}
                className="group text-left p-3 rounded-md  hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm line-clamp-2">
                      {prompt.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            <Label
              htmlFor="template"
              className="group text-left p-3 rounded-md  hover:bg-white/5 transition-all duration-200"
            >
              <div className="flex items-center space-x-2">
                <Switch
                  id="template"
                  checked={showTemplate}
                  onClick={() => {
                    setShowTemplate(!showTemplate);
                  }}
                />
                <span className="text-white/70 text-sm">Use template</span>
              </div>
            </Label>
          </div>
        </Card>
      )}
    </div>
  );
}
