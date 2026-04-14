import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, PencilLine, Plus, Sparkles, Trash2 } from "lucide-react";
import { createAdminJob, deleteAdminJob, fetchAdminJobs, type AdminJob, updateAdminJob } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

function getStatusClasses(status: AdminJob["status"]) {
  return status === "open"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

function listToTextarea(value: string[]) {
  return value.join("\n");
}

function textareaToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function JobEditor({
  draft,
  onChange,
}: {
  draft: AdminJob;
  onChange: (next: AdminJob) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Job title</label>
          <Input value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={draft.status} onValueChange={(value: AdminJob["status"]) => onChange({ ...draft, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          className="min-h-[120px]"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Experience years</label>
          <Input
            type="number"
            min={0}
            value={draft.experience_years}
            onChange={(event) => onChange({ ...draft, experience_years: Number(event.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Employment type</label>
          <Select
            value={draft.employment_type}
            onValueChange={(value: AdminJob["employment_type"]) => onChange({ ...draft, employment_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Salary range</label>
          <Input
            value={draft.salary_range ?? ""}
            onChange={(event) => onChange({ ...draft, salary_range: event.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Required skills</label>
          <Textarea
            value={listToTextarea(draft.required_skills)}
            onChange={(event) => onChange({ ...draft, required_skills: textareaToList(event.target.value) })}
            className="min-h-[140px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Responsibilities</label>
          <Textarea
            value={listToTextarea(draft.responsibilities)}
            onChange={(event) => onChange({ ...draft, responsibilities: textareaToList(event.target.value) })}
            className="min-h-[140px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nice to have</label>
          <Textarea
            value={listToTextarea(draft.nice_to_have_qualifications)}
            onChange={(event) =>
              onChange({ ...draft, nice_to_have_qualifications: textareaToList(event.target.value) })
            }
            className="min-h-[140px]"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminJobsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [jobTitleInput, setJobTitleInput] = useState("");
  const [draftJob, setDraftJob] = useState<AdminJob | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: fetchAdminJobs,
    retry: false,
  });

  const openCount = useMemo(() => jobs.filter((job) => job.status === "open").length, [jobs]);

  const createMutation = useMutation({
    mutationFn: ({ title }: { title: string }) => createAdminJob({ title }),
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      setDraftJob(job);
      toast({
        title: "AI draft ready",
        description: "The job post was generated and saved. Review the draft below before closing the modal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Job generation failed",
        description: error instanceof Error ? error.message : "The AI draft could not be generated right now.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (job: AdminJob) =>
      updateAdminJob(job.job_id, {
        title: job.title,
        description: job.description,
        required_skills: job.required_skills,
        experience_years: job.experience_years,
        employment_type: job.employment_type,
        salary_range: job.salary_range,
        responsibilities: job.responsibilities,
        nice_to_have_qualifications: job.nice_to_have_qualifications,
        status: job.status,
      }),
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      setDraftJob(job);
      setIsDialogOpen(false);
      toast({
        title: "Job saved",
        description: "The posting has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to save job",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: number; status: AdminJob["status"] }) => updateAdminJob(jobId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: () => {
      toast({
        title: "Unable to update status",
        description: "The job status could not be changed.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (jobId: number) => deleteAdminJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast({
        title: "Job removed",
        description: "The posting has been deleted from the admin dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "The job could not be deleted.",
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    setJobTitleInput("");
    setDraftJob(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (job: AdminJob) => {
    setJobTitleInput(job.title);
    setDraftJob(job);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">AI-assisted job position management</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create a posting from only a job title, review the generated draft, then keep openings and closures under one HR workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
            {openCount} open roles
          </Badge>
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Add New Job
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Job postings</h2>
            <p className="text-sm text-muted-foreground">Manage draft quality, lifecycle status, and live openings.</p>
          </div>
          <Badge variant="outline">{jobs.length} total</Badge>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Loading jobs...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.job_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{job.employment_type}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusClasses(job.status)}>
                      {job.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(job.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditDialog(job)}>
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            jobId: job.job_id,
                            status: job.status === "open" ? "closed" : "open",
                          })
                        }
                      >
                        {job.status === "open" ? "Close" : "Reopen"}
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => deleteMutation.mutate(job.job_id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{draftJob ? "Review Job Draft" : "Generate New Job Draft"}</DialogTitle>
            <DialogDescription>
              Start with a title, let AI generate the details, then edit the full job post before you continue.
            </DialogDescription>
          </DialogHeader>

          {!draftJob ? (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  One title in, complete post out
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  The backend will create the job immediately, then you can refine the generated description, requirements, and responsibilities here.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Job title</label>
                <Input
                  placeholder="Senior Python Developer"
                  value={jobTitleInput}
                  onChange={(event) => setJobTitleInput(event.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => createMutation.mutate({ title: jobTitleInput.trim() })}
                  disabled={!jobTitleInput.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Draft
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                The generated posting is already saved. Make any edits you want here, then click Save Changes.
              </div>

              <JobEditor draft={draftJob} onChange={setDraftJob} />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => draftJob && saveMutation.mutate(draftJob)} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
