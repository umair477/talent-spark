import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, UserRoundCheck, UserRoundX } from "lucide-react";
import {
  createAdminEmployee,
  deactivateAdminEmployee,
  fetchAdminEmployees,
  type AdminEmployee,
  updateAdminEmployee,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

function roleBadge(role: AdminEmployee["role"]) {
  return role === "admin"
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statusLabel(employee: AdminEmployee) {
  if (!employee.is_active) {
    return {
      text: "Inactive",
      classes: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  if (!employee.password_set) {
    return {
      text: "Pending",
      classes: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  return {
    text: "Active",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

const emptyCreateForm = {
  full_name: "",
  official_email: "",
  department: "",
  designation: "",
  date_of_joining: "",
  role: "employee" as "employee" | "admin",
};

export default function AdminEmployeesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [selectedEmployee, setSelectedEmployee] = useState<AdminEmployee | null>(null);
  const [editForm, setEditForm] = useState({
    department: "",
    designation: "",
    role: "employee" as "employee" | "admin",
    is_active: true,
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["admin-employees"],
    queryFn: fetchAdminEmployees,
    retry: false,
  });

  const pendingCount = useMemo(
    () => employees.filter((employee) => employee.is_active && !employee.password_set).length,
    [employees],
  );

  const createMutation = useMutation({
    mutationFn: createAdminEmployee,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-employees"] });
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      toast({
        title: "Employee added",
        description: `Employee added. A welcome email has been sent to ${variables.official_email}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to add employee",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ employeeId, payload }: { employeeId: number; payload: Parameters<typeof updateAdminEmployee>[1] }) =>
      updateAdminEmployee(employeeId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-employees"] });
      setEditOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Employee updated",
        description: "Employee profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to update employee",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (employeeId: number) => deactivateAdminEmployee(employeeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-employees"] });
      toast({
        title: "Employee deactivated",
        description: "The employee account has been marked inactive.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to deactivate employee",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const openEdit = (employee: AdminEmployee) => {
    setSelectedEmployee(employee);
    setEditForm({
      department: employee.department,
      designation: employee.designation,
      role: employee.role,
      is_active: employee.is_active,
    });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Employee management</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add employee profiles, track activation state, and update department, designation, and access role in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
            {pendingCount} pending activation
          </Badge>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Employees</h2>
            <p className="text-sm text-muted-foreground">Track activation status and maintain profile records.</p>
          </div>
          <Badge variant="outline">{employees.length} employees</Badge>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Loading employees...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const status = statusLabel(employee);
                return (
                  <TableRow key={employee.employee_id}>
                    <TableCell className="font-medium">{employee.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{employee.official_email}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>{format(new Date(employee.date_of_joining), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleBadge(employee.role)}>
                        {employee.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.classes}>
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(employee)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!employee.is_active || deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(employee.employee_id)}
                        >
                          Deactivate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Create a new employee record and send activation email.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate(createForm);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={createForm.full_name}
                onChange={(event) => setCreateForm((current) => ({ ...current, full_name: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="official_email">Official Email</Label>
              <Input
                id="official_email"
                type="email"
                value={createForm.official_email}
                onChange={(event) => setCreateForm((current) => ({ ...current, official_email: event.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={createForm.department}
                  onChange={(event) => setCreateForm((current) => ({ ...current, department: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={createForm.designation}
                  onChange={(event) => setCreateForm((current) => ({ ...current, designation: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_joining">Date of Joining</Label>
                <Input
                  id="date_of_joining"
                  type="date"
                  value={createForm.date_of_joining}
                  onChange={(event) => setCreateForm((current) => ({ ...current, date_of_joining: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value: "employee" | "admin") =>
                    setCreateForm((current) => ({ ...current, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Add Employee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update department, designation, role, and active status.</DialogDescription>
          </DialogHeader>

          {!selectedEmployee ? null : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                updateMutation.mutate({
                  employeeId: selectedEmployee.employee_id,
                  payload: editForm,
                });
              }}
            >
              <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">
                <p className="font-medium">{selectedEmployee.full_name}</p>
                <p className="text-muted-foreground">{selectedEmployee.official_email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_department">Department</Label>
                  <Input
                    id="edit_department"
                    value={editForm.department}
                    onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_designation">Designation</Label>
                  <Input
                    id="edit_designation"
                    value={editForm.designation}
                    onChange={(event) => setEditForm((current) => ({ ...current, designation: event.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value: "employee" | "admin") =>
                      setEditForm((current) => ({ ...current, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <Select
                    value={editForm.is_active ? "active" : "inactive"}
                    onValueChange={(value: "active" | "inactive") =>
                      setEditForm((current) => ({ ...current, is_active: value === "active" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <span className="inline-flex items-center gap-2">
                          <UserRoundCheck className="h-4 w-4" />
                          Active
                        </span>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <span className="inline-flex items-center gap-2">
                          <UserRoundX className="h-4 w-4" />
                          Inactive
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
