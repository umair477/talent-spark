import { Bell, Moon, Search, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/hooks/use-theme";
import { useEmployeeAuth } from "@/hooks/use-employee-auth";
import { useSessionProfile } from "@/hooks/use-session-profile";
import { signOutDemoSession } from "@/lib/auth";

function initialsForName(name?: string) {
  if (!name) {
    return "TS";
  }
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { data: profile } = useSessionProfile();
  const employeeAuth = useEmployeeAuth();

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-card/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground" />
        <div className="relative hidden w-64 md:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              profile?.role === "CANDIDATE" ? "Search open roles..." : "Search employees, candidates..."
            }
            className="h-9 border-0 bg-secondary/50 pl-9 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {profile && (
          <div className="hidden rounded-full border bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground md:block">
            {profile.role}
          </div>
        )}

        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                  {initialsForName(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.full_name ?? "Loading session..."}</p>
              <p className="text-xs text-muted-foreground">{profile?.email ?? "Awaiting profile"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                if (employeeAuth.isAuthenticated) {
                  await employeeAuth.logout();
                } else {
                  signOutDemoSession();
                }
                navigate("/signed-out");
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
