import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, UserRound } from "lucide-react";
import { sendEmployeeLeaveChat, type LeaveChatHistoryItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "How many annual leaves do I have left?",
  "I need sick leave from Monday to Wednesday",
  "I want to request casual leave next week",
];

export default function EmployeeChatPage() {
  const [conversationHistory, setConversationHistory] = useState<LeaveChatHistoryItem[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversationHistory, isSending]);

  const sendMessage = async (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || isSending) {
      return;
    }

    const historyBeforeTurn = conversationHistory;
    setConversationHistory([...historyBeforeTurn, { role: "user", content: trimmed }]);
    setMessage("");
    setIsSending(true);

    try {
      const response = await sendEmployeeLeaveChat({
        message: trimmed,
        conversation_history: historyBeforeTurn,
      });
      setConversationHistory(response.conversation_history);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Unable to contact leave assistant.";
      setConversationHistory((current) => [
        ...current,
        {
          role: "assistant",
          content: `I could not process that request right now. ${errorText}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Employee Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">AI Leave Assistant</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask naturally and the assistant will collect details, check quota/conflicts, and submit after your confirmation.
        </p>
      </section>

      <section className="flex h-[70vh] flex-col overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {conversationHistory.length === 0 && (
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              Start with a message like: "I need annual leave from 2026-05-12 to 2026-05-15".
            </div>
          )}

          {conversationHistory.map((item, index) => {
            const isUser = item.role === "user";
            return (
              <div key={`${item.role}-${index}-${item.content.slice(0, 16)}`} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                <div className={cn("mt-1 flex h-8 w-8 items-center justify-center rounded-xl", isUser ? "bg-slate-100 text-slate-600" : "bg-primary/10 text-primary")}>
                  {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
                    isUser
                      ? "rounded-tr-md bg-primary text-primary-foreground"
                      : "rounded-tl-md border bg-card text-foreground",
                  )}
                >
                  {item.content}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-md border bg-card px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-white p-4 md:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void sendMessage(suggestion)}
                className="rounded-full border bg-secondary px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary/70"
                disabled={isSending}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(message);
                }
              }}
              placeholder="Type your leave request..."
              disabled={isSending}
            />
            <Button onClick={() => void sendMessage(message)} disabled={!message.trim() || isSending} size="icon">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
