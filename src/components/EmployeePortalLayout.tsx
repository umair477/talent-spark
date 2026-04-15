import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmployeeAuth } from "@/hooks/use-employee-auth";
import { signOutDemoSession } from "@/lib/auth";

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    : "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
}

export function EmployeePortalLayout() {
  const navigate = useNavigate();
  const employeeAuth = useEmployeeAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <NavLink to="/employee/chat" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            Talent Spark
          </NavLink>

          <nav className="flex items-center gap-2">
            <NavLink to="/employee/chat" className={navClassName}>
              Chat Assistant
            </NavLink>
            <NavLink to="/employee/leaves" className={navClassName}>
              My Leaves
            </NavLink>
          </nav>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              if (employeeAuth.isAuthenticated) {
                await employeeAuth.logout();
              } else {
                signOutDemoSession();
              }
              navigate("/employee/login", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
