import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { fetchMyLeaveBalance } from "@/lib/api";
import { useSessionProfile } from "@/hooks/use-session-profile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

function formatLeaveNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useSessionProfile();
  const isEmployee = profile?.role === "EMPLOYEE";
  const isCandidate = profile?.role === "CANDIDATE";
  const isAdmin = profile?.role === "ADMIN";

  const navItems = isCandidate
    ? [
        { title: "Jobs", url: "/jobs", icon: BriefcaseBusiness },
        { title: "Profile", url: "/profile", icon: UserRound },
      ]
    : isAdmin
      ? [
          { title: "Dashboard", url: "/admin/dashboard", icon: Sparkles },
          { title: "Jobs", url: "/admin/jobs", icon: BriefcaseBusiness },
          { title: "Candidates", url: "/admin/candidates", icon: Users },
          { title: "Employees", url: "/admin/employees", icon: UserRound },
          { title: "Leaves", url: "/admin/leaves", icon: CalendarDays },
          { title: "User Management", url: "/users", icon: ShieldCheck },
          { title: "Analytics", url: "/analytics", icon: BarChart3 },
          { title: "Profile", url: "/profile", icon: UserRound },
        ]
      : [
        { title: "Dashboard", url: "/employee/dashboard", icon: Sparkles },
        { title: "Leave", url: "/leave", icon: CalendarDays },
        { title: "Profile", url: "/profile", icon: UserRound },
      ];

  const { data: balance } = useQuery({
    queryKey: ["leave-balance", "me"],
    queryFn: fetchMyLeaveBalance,
    enabled: isEmployee,
    retry: false,
  });

  const total = balance?.total ?? 20;
  const remaining = balance?.remaining ?? total;
  const used = balance?.used ?? 0;
  const progress = total > 0 ? Math.min((remaining / total) * 100, 100) : 0;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Sparkles className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {isCandidate ? "Talent Spark Jobs" : isAdmin ? "HR Admin Hub" : "NexGen HR"}
              </span>
              <span className="text-xs text-sidebar-muted">
                {isCandidate ? "Candidate portal" : isAdmin ? "Protected manager workspace" : "Role-aware workspace"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="space-y-2 p-2">
        {isEmployee && !collapsed && (
          <button
            type="button"
            onClick={() => navigate("/leave/history")}
            className="w-full rounded-xl bg-sidebar-accent p-3 text-left transition-colors hover:bg-sidebar-accent/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-sidebar-foreground">Leave Balance</span>
              <span className="text-xs text-sidebar-muted">
                {formatLeaveNumber(remaining)}/{formatLeaveNumber(total)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sidebar-border">
              <div className="h-full rounded-full bg-sidebar-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-sidebar-muted">
              {formatLeaveNumber(used)} days used · {formatLeaveNumber(remaining)} remaining
            </p>
          </button>
        )}

        {isEmployee && collapsed && (
          <button
            type="button"
            onClick={() => navigate("/leave/history")}
            className="flex w-full flex-col items-center gap-0.5 rounded-lg py-1 transition-colors hover:bg-sidebar-accent"
            title={`Leave: ${formatLeaveNumber(remaining)}/${formatLeaveNumber(total)} days remaining`}
          >
            <CalendarDays className="h-4 w-4 text-sidebar-muted" />
            <span className="text-[10px] font-medium text-sidebar-foreground">{formatLeaveNumber(remaining)}</span>
          </button>
        )}

        {!collapsed && profile && (
          <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-2 text-xs text-sidebar-muted">
            Signed in as {profile.role.toLowerCase()}
          </div>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-8 w-full items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
