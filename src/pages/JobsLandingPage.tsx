import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CalendarClock, Sparkles } from "lucide-react";
import { applyForJob, fetchPublicJobs } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function JobsLandingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: fetchPublicJobs,
    retry: false,
  });

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
    onError: (error) => {
      toast({
        title: "Unable to apply right now",
        description: error instanceof Error ? error.message : "The application could not be associated with your candidate account.",
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
          These openings are powered by the HR admin dashboard. Clicking Apply links the role to your candidate profile
          and opens your private recruitment status view.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Loading open roles...</div>
        ) : jobs.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">No open roles are available right now.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Job Title</th>
                <th className="px-6 py-4 font-medium">Experience</th>
                <th className="px-6 py-4 font-medium">Compensation</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.job_id} className="border-t">
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BriefcaseBusiness className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{job.title}</p>
                          <Badge variant="outline">{job.employment_type}</Badge>
                        </div>
                        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{job.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-muted-foreground">{job.experience_years}+ years</td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      <span>{job.salary_range ?? "Competitive"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button
                      onClick={() =>
                        applyMutation.mutate({
                          job_id: job.job_id,
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
        )}
      </div>
    </div>
  );
}
