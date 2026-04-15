import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Mail, X } from "lucide-react";
import { fetchAdminLeaves, fetchLeaveQuotas, type AdminLeave, updateAdminLeave } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

function statusClasses(status: AdminLeave["status"]) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function quotaClasses(value: number) {
  if (value === 0) {
    return "text-rose-700";
  }
  if (value <= 5) {
    return "text-amber-700";
  }
  return "text-emerald-700";
}

export default function LeavePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rejectTarget, setRejectTarget] = useState<AdminLeave | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ["admin-leaves"],
    queryFn: fetchAdminLeaves,
    retry: false,
  });

  const { data: quotas = [], isLoading: quotasLoading } = useQuery({
    queryKey: ["leave-quotas"],
    queryFn: fetchLeaveQuotas,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ leaveId, status, hrNote }: { leaveId: number; status: "approved" | "rejected"; hrNote?: string }) =>
      updateAdminLeave(leaveId, { status, hr_note: hrNote }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-leaves"] }),
        queryClient.invalidateQueries({ queryKey: ["leave-quotas"] }),
        queryClient.invalidateQueries({ queryKey: ["leave-history"] }),
      ]);

      const leave = leaves.find((item) => item.leave_id === variables.leaveId);
      const employeeName = leave?.employee_name ?? "employee";

      if (variables.status === "approved") {
        toast({
          title: "Leave approved",
          description: `Leave approved. A confirmation email has been sent to ${employeeName}.`,
        });
      } else {
        toast({
          title: "Leave rejected",
          description: `Leave rejected. A notification email has been sent to ${employeeName}.`,
        });
        setRejectTarget(null);
        setRejectReason("");
        setRejectError("");
      }
    },
    onError: (error) => {
      toast({
        title: "Unable to update leave request",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-[2rem] border bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admin Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Leave request management</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review employee leave requests, capture rejection reasons, and monitor annual, sick, and casual balances side by side.
        </p>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="quota">Leave Quota</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Requests</h2>
                <p className="text-sm text-muted-foreground">Approve instantly or reject with a required reason.</p>
              </div>
              <Badge variant="outline">{leaves.length} requests</Badge>
            </div>

            {leavesLoading ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">Loading leave requests...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HR Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.leave_id}>
                      <TableCell className="font-medium">{leave.employee_name}</TableCell>
                      <TableCell>{leave.leave_type}</TableCell>
                      <TableCell>{format(new Date(leave.start_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(leave.end_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{leave.total_days}</TableCell>
                      <TableCell className="max-w-xs text-muted-foreground">{leave.reason}</TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-2">
                          <Badge variant="outline" className={statusClasses(leave.status)}>
                            {leave.status}
                          </Badge>
                          {leave.email_sent_at ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                                  <Mail className="h-3.5 w-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Email notification sent on {format(new Date(leave.email_sent_at), "MMM d, yyyy h:mm a")}
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px] text-sm text-muted-foreground">{leave.hr_note || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate({
                                leaveId: leave.leave_id,
                                status: "approved",
                                hrNote: leave.hr_note,
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={updateMutation.isPending}
                            onClick={() => {
                              setRejectTarget(leave);
                              setRejectReason("");
                              setRejectError("");
                            }}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quota" className="space-y-4">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Leave quota</h2>
                <p className="text-sm text-muted-foreground">Annual leave: 20 days. Sick leave: 10 days. Casual leave: 5 days.</p>
              </div>
              <Badge variant="outline">{quotas.length} employees</Badge>
            </div>

            {quotasLoading ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">Loading leave quota balances...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Annual Remaining</TableHead>
                    <TableHead>Sick Remaining</TableHead>
                    <TableHead>Casual Remaining</TableHead>
                    <TableHead>Unpaid Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((quota) => (
                    <TableRow key={quota.employee_id}>
                      <TableCell className="font-medium">{quota.employee_name}</TableCell>
                      <TableCell className={quotaClasses(quota.annual_remaining)}>{quota.annual_remaining}</TableCell>
                      <TableCell className={quotaClasses(quota.sick_remaining)}>{quota.sick_remaining}</TableCell>
                      <TableCell className={quotaClasses(quota.casual_remaining)}>{quota.casual_remaining}</TableCell>
                      <TableCell>{quota.unpaid_used}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectTarget !== null} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
            <DialogDescription>Provide a clear reason before rejecting this leave request.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                if (event.target.value.trim()) {
                  setRejectError("");
                }
              }}
              placeholder="Type the rejection reason"
              className="min-h-[140px]"
            />
            {rejectError ? <p className="text-sm text-destructive">{rejectError}</p> : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={updateMutation.isPending}
                onClick={() => {
                  if (!rejectTarget) {
                    return;
                  }
                  if (!rejectReason.trim()) {
                    setRejectError("A reason is required when rejecting a leave.");
                    return;
                  }
                  updateMutation.mutate({
                    leaveId: rejectTarget.leave_id,
                    status: "rejected",
                    hrNote: rejectReason.trim(),
                  });
                }}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
