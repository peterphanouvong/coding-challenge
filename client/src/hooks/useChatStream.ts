/**
 * Custom hook for handling chat message streaming
 * Encapsulates streaming logic and message state management
 */

import { useState, useCallback } from "react";
import { chatApi, ApiError } from "@/lib/api";
import { parseMessageComponents, ParsedComponents } from "@/lib/messageParser";
import { ERROR_MESSAGES } from "@/lib/constants";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  uiComponent?: ParsedComponents["uiComponent"];
  actions?: ParsedComponents["actions"];
  summary?: ParsedComponents["summary"];
}

interface UseChatStreamReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearError: () => void;
}

/**
 * Creates a new message with a unique ID
 */
function createMessage(
  overrides?: Partial<ChatMessage>
): ChatMessage {
  return {
    id: Math.random().toString(36).slice(2),
    role: "assistant",
    content: "",
    ...overrides,
  };
}

/**
 * Custom hook for chat streaming functionality
 */
export function useChatStream(): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) {
        return;
      }

      // Create user and assistant messages
      const userMessage = createMessage({ role: "user", content });
      const assistantMessage = createMessage({ role: "assistant", content: "" });

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setError(null);
      setIsStreaming(true);

      try {
        // Prepare conversation history for API
        const conversation = [...messages, { role: "user" as const, content }]
          .map(({ role, content }) => ({ role, content }))
          .filter(
            (msg): msg is { role: "user" | "assistant"; content: string } =>
              typeof msg.role === "string" && typeof msg.content === "string"
          );

        // Get streaming response
        const response = await chatApi.sendMessage(conversation);
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        // Read stream chunks
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          if (value) {
            assistantText += decoder.decode(value, { stream: true });

            // Parse components from accumulated text
            const parsed = parseMessageComponents(assistantText);

            // Update message with parsed content
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? {
                      ...msg,
                      content: assistantText,
                      uiComponent: parsed.uiComponent,
                      actions: parsed.actions,
                      summary: parsed.summary,
                    }
                  : msg
              )
            );
          }
        }

        // Final flush of decoder
        assistantText += decoder.decode();

        // Final update with cleaned content
        const finalParsed = parseMessageComponents(assistantText);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: finalParsed.cleanedContent,
                  uiComponent: finalParsed.uiComponent,
                  actions: finalParsed.actions,
                  summary: finalParsed.summary,
                }
              : msg
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : ERROR_MESSAGES.NETWORK_ERROR;

        console.error("Chat stream error:", err);
        setError(errorMessage);

        // Remove the failed assistant message
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessage.id)
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    setMessages,
    clearError,
  };
}
