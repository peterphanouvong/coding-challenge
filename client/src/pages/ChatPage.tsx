import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RequestTemplate } from "@/components/RequestTemplate";
import { ClarificationForm } from "@/components/ClarificationForm";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8999";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  clarificationForm?: {
    message: string;
    fields: Array<{ name: string; required: boolean }>;
  };
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

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !isStreaming,
    [input, isStreaming]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleUseTemplate = (message: string) => {
    setInput(message);
    setShowTemplate(false);
  };

  const handleClarificationSubmit = async (data: Record<string, any>) => {
    // Build a structured message from the form data
    let message = "Here's the information you requested:\n\n";
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        message += `${key}: ${value}\n`;
      }
    });

    // Simulate a form event to use existing submit handler
    const userMessage = createMessage({ role: "user", content: message.trim() });
    const assistantMessage = createMessage({ role: "assistant", content: "" });

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setError(null);
    setIsStreaming(true);

    const conversation = [...messages, { role: "user", content: message.trim() }]
      .map(({ role, content }) => ({ role, content }))
      .filter(
        (msg): msg is { role: Role; content: string } =>
          typeof msg.role === "string" &&
          typeof msg.content === "string"
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

          // Check for clarification form markers
          const clarificationMatch = assistantText.match(
            /__CLARIFICATION_FORM__\n(.*?)\n__END_CLARIFICATION_FORM__/s
          );

          if (clarificationMatch) {
            try {
              const formData = JSON.parse(clarificationMatch[1]);
              const contentBefore = assistantText.substring(0, clarificationMatch.index);

              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessage.id
                    ? {
                        ...message,
                        content: contentBefore.trim(),
                        clarificationForm: formData,
                      }
                    : message
                )
              );
            } catch (e) {
              console.error("Failed to parse clarification form:", e);
            }
          } else {
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
      }

      assistantText += decoder.decode();

      // Final check for clarification form
      const clarificationMatch = assistantText.match(
        /__CLARIFICATION_FORM__\n(.*?)\n__END_CLARIFICATION_FORM__/s
      );

      if (clarificationMatch) {
        try {
          const formData = JSON.parse(clarificationMatch[1]);
          const contentBefore = assistantText.substring(0, clarificationMatch.index);

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    content: contentBefore.trim(),
                    clarificationForm: formData,
                  }
                : message
            )
          );
        } catch (e) {
          console.error("Failed to parse clarification form:", e);
        }
      } else {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: assistantText }
              : message
          )
        );
      }
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong";
      console.error(caughtError);
      setError(errorMessage);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantMessage.id)
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userText = input.trim();

    if (!userText || isStreaming) {
      return;
    }

    const userMessage = createMessage({ role: "user", content: userText });
    const assistantMessage = createMessage({ role: "assistant", content: "" });

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setError(null);
    setIsStreaming(true);

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

          // Check for clarification form markers
          const clarificationMatch = assistantText.match(
            /__CLARIFICATION_FORM__\n(.*?)\n__END_CLARIFICATION_FORM__/s
          );

          if (clarificationMatch) {
            try {
              const formData = JSON.parse(clarificationMatch[1]);
              const contentBefore = assistantText.substring(0, clarificationMatch.index);

              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessage.id
                    ? {
                        ...message,
                        content: contentBefore.trim(),
                        clarificationForm: formData,
                      }
                    : message
                )
              );
            } catch (e) {
              console.error("Failed to parse clarification form:", e);
            }
          } else {
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
      }

      assistantText += decoder.decode();

      // Final check for clarification form
      const clarificationMatch = assistantText.match(
        /__CLARIFICATION_FORM__\n(.*?)\n__END_CLARIFICATION_FORM__/s
      );

      if (clarificationMatch) {
        try {
          const formData = JSON.parse(clarificationMatch[1]);
          const contentBefore = assistantText.substring(0, clarificationMatch.index);

          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    content: contentBefore.trim(),
                    clarificationForm: formData,
                  }
                : message
            )
          );
        } catch (e) {
          console.error("Failed to parse clarification form:", e);
        }
      } else {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: assistantText }
              : message
          )
        );
      }
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
      {/* Template Overlay */}
      {showTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <RequestTemplate
            onUseTemplate={handleUseTemplate}
            onClose={() => setShowTemplate(false)}
          />
        </div>
      )}

      <header className="chat-header">
        <h1>Frontdoor</h1>
      </header>

      <div className="chat-window">
        {messages.length === 0 && (
          <div className="placeholder">
            <p>No messages yet... Make a request!</p>
            <Button
              onClick={() => setShowTemplate(true)}
              variant="outline"
              className="mt-4"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.role}`}>
            <span className="message-role">
              {message.role === "user" ? "You" : "Assistant"}
            </span>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {message.content ||
                (message.role === "assistant" && isStreaming ? "…" : "")}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      <form className="chat-input" onSubmit={handleSubmit}>
        <Button
          type="button"
          onClick={() => setShowTemplate(true)}
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={isStreaming}
        >
          <Sparkles className="h-5 w-5" />
        </Button>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="What legal request do you have?"
          disabled={isStreaming}
        />
        <button type="submit" disabled={!canSubmit}>
          {isStreaming ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}
