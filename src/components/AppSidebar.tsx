import { useState } from "react";
import { MessageSquare, Users, CalendarDays, BarChart3, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Chat Assistant", url: "/", icon: MessageSquare },
  { title: "Recruitment Hub", url: "/recruitment", icon: Users },
  { title: "Leave Calendar", url: "/leave", icon: CalendarDays },
  { title: "Analytics Dashboard", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Sparkles className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">NexGen HR</span>
              <span className="text-xs text-sidebar-muted">Intelligence Suite</span>
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
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="rounded-lg transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-2">
        {!collapsed && (
          <div className="rounded-xl bg-sidebar-accent p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-sidebar-foreground">Leave Balance</span>
              <span className="text-xs text-sidebar-muted">15/20</span>
            </div>
            <div className="h-2 rounded-full bg-sidebar-border overflow-hidden">
              <div className="h-full rounded-full bg-sidebar-primary transition-all" style={{ width: "75%" }} />
            </div>
            <p className="text-[10px] text-sidebar-muted">5 days used · 15 remaining</p>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-0.5 py-1" title="Leave: 15/20 days">
            <CalendarDays className="h-4 w-4 text-sidebar-muted" />
            <span className="text-[10px] font-medium text-sidebar-foreground">15</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-full items-center justify-center rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
