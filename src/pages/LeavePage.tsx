import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchLeaveRequests, updateLeaveRequestStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function getSentimentStyle(s: string) {
  switch (s) {
    case "positive": return "bg-success/10 text-success border-success/20";
    case "neutral": return "bg-primary/10 text-primary border-primary/20";
    case "concern": return "bg-warning/10 text-warning border-warning/20";
    default: return "";
  }
}

export default function LeavePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [optimisticState, setOptimisticState] = useState<Record<number, "approved" | "denied">>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: fetchLeaveRequests,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "denied" }) =>
      updateLeaveRequestStatus(id, status),
    onMutate: ({ id, status }) => {
      setOptimisticState((current) => ({ ...current, [id]: status }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: () => {
      toast({
        title: "Unable to update request",
        description: "Make sure the backend is running and reachable.",
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      setOptimisticState((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
    },
  });

  const normalizedRequests = requests.map((request) => {
    const currentStatus = optimisticState[request.id] ?? request.status;
    const reason = request.reason;
    const sentiment =
      request.privacy_flagged || /stress|burnout|overwhelmed/i.test(reason)
        ? "concern"
        : /vacation|conference|wedding|family/i.test(reason)
          ? "positive"
          : "neutral";
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    return {
      ...request,
      status: currentStatus,
      avatar: request.employee_name
        .split(" ")
        .map((name) => name[0])
        .join(""),
      name: request.employee_name,
      days,
      dates: `${format(start, "MMM d")} – ${format(end, "MMM d")}`,
      sentiment,
    };
  });

  const pending = normalizedRequests.filter((request) => request.status === "pending");
  const resolved = normalizedRequests.filter((request) => request.status !== "pending");

  const updateStatus = (id: number, status: "approved" | "denied") => {
    mutation.mutate({ id, status });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Leave Management</h1>
        <p className="text-sm text-muted-foreground">{pending.length} pending requests</p>
      </div>

      {isLoading && (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Loading leave requests from the FastAPI backend...
        </div>
      )}

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
