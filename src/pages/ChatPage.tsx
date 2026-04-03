import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Bot, User, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ensureDemoToken } from "@/lib/auth";
import { WS_BASE_URL } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  workflow?: string;
  structuredReport?: {
    start_date?: string;
    end_date?: string;
    reason_summary?: string;
    urgency_level?: string;
    handover_contact?: string;
    approval_status?: string;
  } | null;
  privacyNote?: string | null;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "bot",
    content: "Hello! 👋 I'm your NexGen HR Assistant. I can help you with recruitment screening, leave management, employee queries, and more. How can I help you today?",
    timestamp: new Date(),
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionLabel, setConnectionLabel] = useState("Connecting");
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    let active = true;

    async function connect() {
      try {
        const token = await ensureDemoToken();
        if (!active) return;
        const socket = new WebSocket(`${WS_BASE_URL}/api/ws/chat?token=${encodeURIComponent(token)}`);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!active) return;
          setIsConnecting(false);
          setConnectionLabel("Live");
        };

        socket.onmessage = (event) => {
          if (!active) return;
          const payload = JSON.parse(event.data) as {
            workflow: string;
            reply: string;
            privacy_note?: string | null;
            structured_report?: Message["structuredReport"];
          };
          setIsTyping(false);
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "bot",
              content: payload.reply,
              workflow: payload.workflow,
              structuredReport: payload.structured_report ?? null,
              privacyNote: payload.privacy_note ?? null,
              timestamp: new Date(),
            },
          ]);
        };

        socket.onerror = () => {
          if (!active) return;
          setIsTyping(false);
          setConnectionLabel("Offline");
          toast({
            title: "Chat backend unavailable",
            description: "Start the FastAPI server to enable live HR chat.",
            variant: "destructive",
          });
        };

        socket.onclose = () => {
          if (!active) return;
          setIsTyping(false);
          setConnectionLabel("Disconnected");
          setIsConnecting(false);
        };
      } catch (error) {
        if (!active) return;
        setIsConnecting(false);
        setConnectionLabel("Offline");
        toast({
          title: "Unable to connect",
          description: error instanceof Error ? error.message : "Demo login failed.",
          variant: "destructive",
        });
      }
    }

    connect();

    return () => {
      active = false;
      socketRef.current?.close();
    };
  }, [toast]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);
    socketRef.current.send(JSON.stringify({ message: trimmed }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] items-center justify-center p-4 md:p-8">
      <div className="glass rounded-2xl w-full max-w-2xl flex flex-col h-full max-h-[700px] animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">HR Assistant</h2>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", connectionLabel === "Live" ? "bg-success animate-pulse" : "bg-warning")} />
            <span className="text-xs text-muted-foreground">{connectionLabel}</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5 animate-fade-in", msg.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs",
                msg.role === "bot" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
              )}>
                {msg.role === "bot" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "bot"
                  ? "bg-card border border-border/50 rounded-tl-md"
                  : "bg-primary text-primary-foreground rounded-tr-md"
              )}>
                <p className="leading-relaxed">{msg.content}</p>
                {msg.workflow && msg.role === "bot" && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      {msg.workflow.replaceAll("_", " ")}
                    </Badge>
                  </div>
                )}
                {msg.privacyNote && (
                  <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                    <div className="flex items-center gap-2 font-medium">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Privacy Filter Active
                    </div>
                    <p className="mt-1 text-warning/90">{msg.privacyNote}</p>
                  </div>
                )}
                {msg.structuredReport && <LeaveSummaryCard report={msg.structuredReport} />}
                <span className={cn(
                  "block text-[10px] mt-1.5",
                  msg.role === "bot" ? "text-muted-foreground" : "text-primary-foreground/70"
                )}>
                  {format(msg.timestamp, "h:mm a")}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50 space-y-2">
          {/* Smart Suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {[
              "Check my payroll",
              "Apply for Senior Dev role",
              "Request leave",
              "View my benefits",
              "Check application status",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                className="px-3 py-1 text-xs rounded-full border bg-secondary/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder={isConnecting ? "Connecting to backend..." : "Ask me anything..."}
              className="flex-1 bg-secondary/50 border-0 focus-visible:ring-1"
            />

            <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isConnecting}>
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaveSummaryCard({
  report,
}: {
  report: NonNullable<Message["structuredReport"]>;
}) {
  return (
    <div className="mt-3 rounded-xl border border-success/20 bg-success/10 p-3 text-xs text-foreground">
      <p className="font-medium text-success">Leave report prepared for HR review</p>
      <div className="mt-2 grid gap-1 text-muted-foreground">
        <p>
          Dates: {report.start_date} to {report.end_date}
        </p>
        <p>Reason: {report.reason_summary ?? "Pending"}</p>
        <p>Urgency: {report.urgency_level ?? "Pending"}</p>
        <p>Handover: {report.handover_contact ?? "Pending"}</p>
        <p>Status: {report.approval_status ?? "pending_hr_review"}</p>
      </div>
    </div>
  );
}
