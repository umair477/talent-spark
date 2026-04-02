import { useState } from "react";
import { Check, X, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeaveRequest {
  id: string;
  name: string;
  avatar: string;
  dates: string;
  days: number;
  reason: string;
  sentiment: "positive" | "neutral" | "concern";
  department: string;
  status: "pending" | "approved" | "denied";
}

const initialRequests: LeaveRequest[] = [
  { id: "1", name: "Sarah Mitchell", avatar: "SM", dates: "Apr 7 – Apr 11", days: 5, reason: "Family vacation planned months ago. Very excited to spend time with kids.", sentiment: "positive", department: "Engineering", status: "pending" },
  { id: "2", name: "Raj Patel", avatar: "RP", dates: "Apr 14 – Apr 15", days: 2, reason: "Medical appointment and recovery time needed.", sentiment: "neutral", department: "Design", status: "pending" },
  { id: "3", name: "Tom Anderson", avatar: "TA", dates: "Apr 21 – Apr 25", days: 5, reason: "Feeling overwhelmed with workload. Need time to recharge and avoid burnout.", sentiment: "concern", department: "Marketing", status: "pending" },
  { id: "4", name: "Lisa Chen", avatar: "LC", dates: "Apr 9 – Apr 10", days: 2, reason: "Attending a professional development conference.", sentiment: "positive", department: "Product", status: "pending" },
  { id: "5", name: "Mike Davis", avatar: "MD", dates: "Apr 28 – Apr 30", days: 3, reason: "Personal matters to attend to.", sentiment: "neutral", department: "Engineering", status: "pending" },
  { id: "6", name: "Amy Foster", avatar: "AF", dates: "Apr 16 – Apr 18", days: 3, reason: "Stressed about deadlines, need a mental health break.", sentiment: "concern", department: "Sales", status: "pending" },
];

function getSentimentStyle(s: string) {
  switch (s) {
    case "positive": return "bg-success/10 text-success border-success/20";
    case "neutral": return "bg-primary/10 text-primary border-primary/20";
    case "concern": return "bg-warning/10 text-warning border-warning/20";
    default: return "";
  }
}

export default function LeavePage() {
  const [requests, setRequests] = useState(initialRequests);

  const updateStatus = (id: string, status: "approved" | "denied") => {
    setRequests((r) => r.map((req) => (req.id === id ? { ...req, status } : req)));
  };

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Leave Management</h1>
        <p className="text-sm text-muted-foreground">{pending.length} pending requests</p>
      </div>

      {pending.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pending.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-md transition-shadow animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {req.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{req.name}</p>
                  <p className="text-xs text-muted-foreground">{req.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {req.dates}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {req.days} days
                </span>
              </div>

              <div>
                <p className="text-sm leading-relaxed">{req.reason}</p>
                <Badge variant="outline" className={cn("mt-2 text-xs capitalize", getSentimentStyle(req.sentiment))}>
                  {req.sentiment === "concern" ? "⚠ Concern" : req.sentiment === "positive" ? "✓ Positive" : "— Neutral"}
                </Badge>
              </div>

              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => updateStatus(req.id, "approved")}>
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => updateStatus(req.id, "denied")}>
                  <X className="h-4 w-4 mr-1" /> Deny
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Resolved</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resolved.map((req) => (
              <div key={req.id} className="rounded-xl border bg-card/50 p-4 opacity-75 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {req.avatar}
                    </div>
                    <p className="font-medium text-sm">{req.name}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    req.status === "approved" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                  )}>
                    {req.status === "approved" ? "Approved" : "Denied"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{req.dates} · {req.days} days</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
