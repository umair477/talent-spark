import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Clock3, ShieldCheck } from "lucide-react";
import { fetchCandidateApplicationStatus } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getStatusClasses(status: string) {
  switch (status) {
    case "Shortlisted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "Interview Scheduled":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function CandidateRecruitmentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-application-status"],
    queryFn: fetchCandidateApplicationStatus,
    retry: false,
  });

  const candidate = data?.candidate ?? null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Application Status</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your recruitment record only</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This candidate view is isolated to the current authenticated user. No other candidate profiles or HR scoring
          dashboards are exposed here.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Loading your application...
        </div>
      ) : !candidate ? (
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">No application linked yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start from the jobs page. When you click Apply, the backend will attach the application to your user
            profile automatically.
          </p>
          <Button asChild className="mt-5">
            <Link to="/jobs">Browse jobs</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{candidate.role_title}</h2>
                <p className="text-sm text-muted-foreground">{candidate.email}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pipeline Status</p>
                <Badge variant="outline" className={`mt-3 ${getStatusClasses(candidate.status)}`}>
                  {candidate.status}
                </Badge>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interview Session</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  <span>{candidate.interview_status.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Summary</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{candidate.summary || "Application submitted."}</p>
            </div>

            {candidate.skim_insights.length > 0 && (
              <div className="mt-6 rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI Skim Insights</p>
                <div className="mt-3 space-y-2">
                  {candidate.skim_insights.map((insight) => (
                    <p key={insight} className="text-sm leading-6 text-foreground">
                      {insight}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Privacy boundary
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              You are seeing only the candidate record associated with your user account. Recruitment dashboards,
              analytics, leave approvals, and employee chat access remain blocked until an admin promotes your account.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/jobs">Back to jobs</Link>
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}
