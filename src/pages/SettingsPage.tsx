import { LogOut, MoonStar, RefreshCcw, ShieldCheck, SunMedium, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { clearDemoTokens, setActiveDemoRole, signOutDemoSession, type DemoRole } from "@/lib/auth";
import { useSessionProfile } from "@/hooks/use-session-profile";

const roleOptions: Array<{ role: DemoRole; label: string; description: string }> = [
  { role: "ADMIN", label: "Admin", description: "Full recruitment, analytics, and approvals workspace." },
  { role: "EMPLOYEE", label: "Employee", description: "Chatbot and personal leave history access." },
  { role: "CANDIDATE", label: "Candidate", description: "Jobs landing and personal application tracking only." },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { data: profile } = useSessionProfile();

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Theme and session controls</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Switch the active demo persona, refresh credentials, or sign out completely to test the RBAC boundaries.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Appearance</p>
          <h2 className="mt-2 text-xl font-semibold">Choose your interface theme</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                theme === "light" ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}
            >
              <SunMedium className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Light</p>
              <p className="mt-1 text-sm text-muted-foreground">Bright interface for reviewing pipelines and leave data.</p>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                theme === "dark" ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}
            >
              <MoonStar className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Dark</p>
              <p className="mt-1 text-sm text-muted-foreground">Lower glare for longer review and screening sessions.</p>
            </button>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Session</p>
          <h2 className="mt-2 text-xl font-semibold">Active role and credential controls</h2>
          <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>Current role: {profile?.role ?? "Unknown"}</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {roleOptions.map((option) => (
              <button
                key={option.role}
                type="button"
                onClick={() => {
                  clearDemoTokens();
                  setActiveDemoRole(option.role);
                  navigate("/");
                }}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  profile?.role === option.role ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                clearDemoTokens();
                navigate("/");
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh current session token
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={() => {
                signOutDemoSession();
                navigate("/signed-out");
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out and return to session chooser
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
