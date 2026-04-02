import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Bot, User, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  widget?: "leave-request";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    const isLeaveRequest = text.toLowerCase().includes("leave");

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: isLeaveRequest
          ? "I can help you request leave. Please fill out the details below:"
          : "Thanks for your message! I've processed your request. Is there anything else I can help you with?",
        widget: isLeaveRequest ? "leave-request" : undefined,
        timestamp: new Date(),
      };
      setMessages((m) => [...m, botMsg]);
    }, 1500);
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
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
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
                {msg.widget === "leave-request" && <LeaveWidget />}
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
              placeholder="Ask me anything..."
              className="flex-1 bg-secondary/50 border-0 focus-visible:ring-1"
            />

            <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaveWidget() {
  const [date, setDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-success/10 border border-success/20 text-sm">
        <p className="font-medium text-success">✓ Leave request submitted</p>
        <p className="text-muted-foreground text-xs mt-1">
          {date && format(date, "PPP")} — {reason || "No reason specified"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
              <CalendarDays className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Reason</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Brief reason for leave..."
          className="min-h-[60px] bg-background/50 text-sm resize-none"
        />
      </div>
      <Button size="sm" className="w-full" onClick={() => setSubmitted(true)} disabled={!date}>
        Submit Request
      </Button>
    </div>
  );
}
