import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarRange, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchMyLeaveBalance, fetchMyLeaveHistory, type LeaveRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatLeaveNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getReasonLabel(request: LeaveRequest) {
  if (request.privacy_flagged) {
    return "Private leave request";
  }
  return request.reason;
}

function getStatusClasses(status: LeaveRequest["status"]) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function LeaveHistoryPage() {
  const { data: balance } = useQuery({
    queryKey: ["leave-balance", "me"],
    queryFn: fetchMyLeaveBalance,
    retry: false,
  });
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["leave-history", "me"],
    queryFn: fetchMyLeaveHistory,
    retry: false,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Leave Ledger</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dynamic leave balance and history</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            This view is backed by approved leave requests in the database, so the remaining balance updates as
            approvals change.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/leave">Open leave workspace</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total Allowance</p>
          <p className="mt-3 text-3xl font-semibold">{formatLeaveNumber(balance?.total ?? 20)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Annual leave entitlement</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Used</p>
          <p className="mt-3 text-3xl font-semibold">{formatLeaveNumber(balance?.used ?? 0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Approved leave days already consumed</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Remaining</p>
          <p className="mt-3 text-3xl font-semibold">{formatLeaveNumber(balance?.remaining ?? 20)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Source: {balance?.provider?.replaceAll("_", " ") ?? "dynamic approved leave requests"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Leave history</h2>
              <p className="text-sm text-muted-foreground">JWT-protected history for the signed-in employee.</p>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {history.length} request{history.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Loading leave history...</div>
        ) : history.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">No leave requests found for this employee yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Start Date</th>
                  <th className="px-6 py-4 font-medium">End Date</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Handover Person</th>
                </tr>
              </thead>
              <tbody>
                {history.map((request) => (
                  <tr key={request.id} className="border-t align-top">
                    <td className="px-6 py-4">{format(new Date(request.start_date), "dd MMM yyyy")}</td>
                    <td className="px-6 py-4">{format(new Date(request.end_date), "dd MMM yyyy")}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="font-medium">{getReasonLabel(request)}</p>
                        {request.privacy_flagged && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Sensitive details are hidden in the ledger view.
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getStatusClasses(request.status)}>
                        {request.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{request.handover_contact || "Self-managed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
