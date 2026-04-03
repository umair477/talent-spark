import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { useSessionProfile } from "@/hooks/use-session-profile";

export default function ProfilePage() {
  const { data, isLoading } = useSessionProfile();

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Current authenticated identity</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This page is powered by <code>/api/auth/me</code> and reflects the exact role and record links attached to
          the active JWT.
        </p>
      </div>

      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{data.full_name}</h2>
                <p className="text-sm text-muted-foreground">{data.role}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{data.email}</span>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Employee Record</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{data.employee_id ?? "Not linked"}</span>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Candidate Record</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{data.candidate_id ?? "Not linked"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
