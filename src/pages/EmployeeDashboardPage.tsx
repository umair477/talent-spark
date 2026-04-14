import { Link } from "react-router-dom";
import { CalendarDays, MessageSquare, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmployeeAuth } from "@/hooks/use-employee-auth";

export default function EmployeeDashboardPage() {
  const { employee } = useEmployeeAuth();

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-[2rem] border bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Employee Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back, {employee?.full_name ?? "Employee"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your employee account is active. From here you can access the HR chatbot, review your leave history, and manage your profile.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Chat Assistant</h2>
          <p className="mt-2 text-sm text-muted-foreground">Open the employee chatbot workspace for HR support and leave assistance.</p>
          <Button asChild className="mt-5">
            <Link to="/chatbot">Open Chatbot</Link>
          </Button>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Leave History</h2>
          <p className="mt-2 text-sm text-muted-foreground">Review current balance, approvals, and submitted leave history.</p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/leave/history">View Leave</Link>
          </Button>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Profile</h2>
          <p className="mt-2 text-sm text-muted-foreground">Check the employee identity and company details associated with this session.</p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/profile">Open Profile</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
