import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, ShieldCheck, UserCog } from "lucide-react";
import { fetchAdminUsers, promoteCandidateToEmployee } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function getRoleClasses(role: string) {
  switch (role) {
    case "ADMIN":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "EMPLOYEE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    retry: false,
  });

  const promoteMutation = useMutation({
    mutationFn: (userId: number) => promoteCandidateToEmployee(userId, { department: "Operations", annual_allowance: 18 }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Candidate promoted",
        description: "The user is now linked to a new employee record and can access employee-only features.",
      });
    },
    onError: () => {
      toast({
        title: "Promotion failed",
        description: "The candidate could not be promoted right now.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">User Management</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin gatekeeper controls</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Promote candidate users to employees to unlock chatbot and leave access. This page is restricted to admin
          sessions only.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Platform users</h2>
              <p className="text-sm text-muted-foreground">Role-scoped identities with candidate and employee links.</p>
            </div>
          </div>
          <Badge variant="outline">{users.length} users</Badge>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Loading users...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Links</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-6 py-4">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={getRoleClasses(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    employee_id: {user.employee_id ?? "none"} · candidate_id: {user.candidate_id ?? "none"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role === "CANDIDATE" ? (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => promoteMutation.mutate(user.id)}
                        disabled={promoteMutation.isPending}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Promote to employee
                      </Button>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        No action needed
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
