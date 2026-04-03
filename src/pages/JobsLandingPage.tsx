import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CalendarClock, Sparkles } from "lucide-react";
import { applyForJob } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const jobListings = [
  {
    id: "python-platform-engineer",
    role_title: "Python Platform Engineer",
    post_date: "2026-04-01",
    deadline: "2026-04-20",
    job_description:
      "Build backend platform services with Python, FastAPI, PostgreSQL, API security, and workflow automation.",
  },
  {
    id: "frontend-design-systems",
    role_title: "Frontend Design Systems Engineer",
    post_date: "2026-03-29",
    deadline: "2026-04-18",
    job_description:
      "Own React, TypeScript, performance, accessibility, and design system scale across customer-facing products.",
  },
  {
    id: "data-analytics-specialist",
    role_title: "Data Analytics Specialist",
    post_date: "2026-03-27",
    deadline: "2026-04-16",
    job_description:
      "Drive SQL-based analytics, dashboards, reporting automation, and stakeholder insights for hiring operations.",
  },
];

export default function JobsLandingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const applyMutation = useMutation({
    mutationFn: applyForJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["candidate-application-status"] });
      toast({
        title: "Application linked to your account",
        description: "Your candidate profile is now associated with this job. Opening your recruitment status.",
      });
      navigate("/recruitment");
    },
    onError: () => {
      toast({
        title: "Unable to apply right now",
        description: "The application could not be associated with your candidate account.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-[2rem] border bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Jobs Landing</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Open roles you can apply to today</h1>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Candidates are routed here immediately after sign-in. Clicking Apply creates or updates the application linked
          to your user account and then opens your private recruitment status view.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Job Title</th>
              <th className="px-6 py-4 font-medium">Post Date</th>
              <th className="px-6 py-4 font-medium">Deadline</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {jobListings.map((job) => (
              <tr key={job.id} className="border-t">
                <td className="px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BriefcaseBusiness className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{job.role_title}</p>
                      <p className="mt-1 max-w-xl text-sm text-muted-foreground">{job.job_description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-muted-foreground">{job.post_date}</td>
                <td className="px-6 py-5">
                  <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    <span>{job.deadline}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <Button
                    onClick={() =>
                      applyMutation.mutate({
                        role_title: job.role_title,
                        job_description: job.job_description,
                      })
                    }
                    disabled={applyMutation.isPending}
                  >
                    Apply
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
