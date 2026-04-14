import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { fetchAdminLeaves, fetchLeaveQuotas, type AdminLeave, updateAdminLeave } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [noteByLeaveId, setNoteByLeaveId] = useState<Record<number, string>>({});

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
    mutationFn: ({ leaveId, status, hrNote }: { leaveId: number; status: "approved" | "rejected"; hrNote: string }) =>
      updateAdminLeave(leaveId, { status, hr_note: hrNote }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-leaves"] }),
        queryClient.invalidateQueries({ queryKey: ["leave-quotas"] }),
        queryClient.invalidateQueries({ queryKey: ["leave-history"] }),
      ]);
      setNoteByLeaveId((current) => ({ ...current, [variables.leaveId]: "" }));
      toast({
        title: `Leave ${variables.status}`,
        description: "The leave request status has been updated.",
      });
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
          Review employee leave requests, record HR notes, and monitor annual, sick, and casual balances side by side.
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
                <p className="text-sm text-muted-foreground">Approve or reject with an optional HR note.</p>
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
                        <Badge variant="outline" className={statusClasses(leave.status)}>
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <Input
                          value={noteByLeaveId[leave.leave_id] ?? leave.hr_note ?? ""}
                          onChange={(event) =>
                            setNoteByLeaveId((current) => ({ ...current, [leave.leave_id]: event.target.value }))
                          }
                          placeholder="Optional HR note"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() =>
                              updateMutation.mutate({
                                leaveId: leave.leave_id,
                                status: "approved",
                                hrNote: noteByLeaveId[leave.leave_id] ?? leave.hr_note ?? "",
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
                            onClick={() =>
                              updateMutation.mutate({
                                leaveId: leave.leave_id,
                                status: "rejected",
                                hrNote: noteByLeaveId[leave.leave_id] ?? leave.hr_note ?? "",
                              })
                            }
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
    </div>
  );
}
