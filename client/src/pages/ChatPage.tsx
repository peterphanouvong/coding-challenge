import {
  LOCATION_VALUES,
  REQUEST_TYPE_VALUES,
  URGENCY_VALUES,
} from "@/components/RuleBuilder";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatRequestType } from "@/lib/formatters";
import { Location, RequestType } from "@/types";
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

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

const createMessage = (overrides?: Partial<ChatMessage>): ChatMessage => ({
  id: Math.random().toString(36).slice(2),
  role: "assistant",
  content: "",
  ...overrides,
});

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
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

          // Regular text update
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, content: assistantText }
                : message
            )
          );
        }
      }

      assistantText += decoder.decode();

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: assistantText }
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
      <header className="chat-header">
        <h1>Frontdoor</h1>
      </header>

      <div className="chat-window">
        {messages.length === 0 && (
          <div className="placeholder">
            <p>No messages yet... Make a request!</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.role}`}>
            <span className="message-role">
              {message.role === "user" ? "You" : "Assistant"}
            </span>
            <p style={{ whiteSpace: "pre-wrap" }}>
              <Markdown>
                {message.content ||
                  (message.role === "assistant" && isStreaming ? "…" : "")}
              </Markdown>
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      <form
        className="chat-input flex-col border rounded-2xl p-2"
        onSubmit={handleSubmit}
      >
        {showTemplate ? (
          <div className="border rounded-xl p-4 flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <p className="">I have a request about </p>
              <div>
                <Select
                  value={selectedRequestType || undefined}
                  onValueChange={(value) =>
                    setSelectedRequestType(value as RequestType)
                  }
                >
                  <SelectTrigger className="min-w-[220px] h-9 bg-transparent">
                    <SelectValue placeholder="Select type...">
                      {formatRequestType(String(selectedRequestType))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPE_VALUES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col items-start text-black">
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
                  <SelectTrigger className="min-w-[180px] h-9 bg-transparent">
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
                  <SelectTrigger className="min-w-[220px] h-9 bg-transparent">
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
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="What legal request do you have?"
            disabled={isStreaming}
          />
        )}

        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="template"
              checked={showTemplate}
              onClick={(e) => {
                setShowTemplate(!showTemplate);
              }}
            />
            <Label htmlFor="template">Use template</Label>
          </div>

          <Button variant={"secondary"} type="submit" disabled={!canSubmit}>
            {isStreaming ? "Thinking…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
