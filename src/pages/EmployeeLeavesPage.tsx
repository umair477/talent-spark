import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { fetchEmployeeLeaveQuota, fetchEmployeeLeaves, type EmployeeLeaveRecord } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function statusBadgeClass(status: EmployeeLeaveRecord["status"]) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function quotaTone(remaining: number, total: number) {
  const ratio = total > 0 ? (remaining / total) * 100 : 0;
  if (ratio > 50) {
    return "border-emerald-200 bg-emerald-50/40";
  }
  if (ratio >= 20) {
    return "border-amber-200 bg-amber-50/40";
  }
  return "border-rose-200 bg-rose-50/40";
}

export default function EmployeeLeavesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const { data: quota, isLoading: quotaLoading } = useQuery({
    queryKey: ["employee-leave-quota"],
    queryFn: fetchEmployeeLeaveQuota,
    retry: false,
  });

  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ["employee-leaves"],
    queryFn: fetchEmployeeLeaves,
    retry: false,
  });

  const filteredLeaves = useMemo(() => {
    if (statusFilter === "all") {
      return leaves;
    }
    return leaves.filter((leave) => leave.status === statusFilter);
  }, [leaves, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentPageLeaves = filteredLeaves.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Employee Portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">My Leaves</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your quota and review all submitted leave requests with status updates.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className={`rounded-2xl border p-5 shadow-sm ${quotaTone(quota?.annual_remaining ?? 0, quota?.annual_total ?? 20)}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Annual Leave</p>
          <p className="mt-2 text-3xl font-semibold">{quotaLoading ? "..." : `${quota?.annual_remaining ?? 0} / ${quota?.annual_total ?? 20}`}</p>
          <p className="mt-1 text-sm text-muted-foreground">days remaining</p>
        </article>
        <article className={`rounded-2xl border p-5 shadow-sm ${quotaTone(quota?.sick_remaining ?? 0, quota?.sick_total ?? 10)}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sick Leave</p>
          <p className="mt-2 text-3xl font-semibold">{quotaLoading ? "..." : `${quota?.sick_remaining ?? 0} / ${quota?.sick_total ?? 10}`}</p>
          <p className="mt-1 text-sm text-muted-foreground">days remaining</p>
        </article>
        <article className={`rounded-2xl border p-5 shadow-sm ${quotaTone(quota?.casual_remaining ?? 0, quota?.casual_total ?? 5)}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Casual Leave</p>
          <p className="mt-2 text-3xl font-semibold">{quotaLoading ? "..." : `${quota?.casual_remaining ?? 0} / ${quota?.casual_total ?? 5}`}</p>
          <p className="mt-1 text-sm text-muted-foreground">days remaining</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Leave History</h2>
            <p className="text-sm text-muted-foreground">Filter by status and browse records in pages of 10.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{filteredLeaves.length} record{filteredLeaves.length === 1 ? "" : "s"}</Badge>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {leavesLoading ? (
          <div className="px-5 py-10 text-sm text-muted-foreground">Loading leave history...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="px-5 py-10 text-sm text-muted-foreground">No leave requests found for this filter.</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageLeaves.map((leave, index) => (
                  <TableRow key={leave.leave_id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell>{leave.leave_type}</TableCell>
                    <TableCell>{format(new Date(leave.start_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(leave.end_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{leave.total_days}</TableCell>
                    <TableCell className="max-w-sm text-muted-foreground">{leave.reason}</TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2">
                        <Badge variant="outline" className={statusBadgeClass(leave.status)}>
                          {leave.status}
                        </Badge>
                        {leave.status === "rejected" && leave.hr_note.trim() && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-rose-600" aria-label="View rejection note">
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">{leave.hr_note}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(leave.submitted_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t px-5 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
