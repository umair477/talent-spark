import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, FileText, MessageSquareText, Star } from "lucide-react";
import { fetchAdminCandidate, fetchAdminCandidates, fetchAdminJobs, type AdminCandidate } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function recommendationClasses(label: AdminCandidate["recommendation_label"]) {
  switch (label) {
    case "Highly Recommended":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Recommended":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "Needs Review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
}

export default function AdminCandidatesPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  const parsedJobId = selectedJobId === "all" ? undefined : Number(selectedJobId);

  const { data: jobs = [] } = useQuery({
    queryKey: ["admin-jobs", "filter-options"],
    queryFn: fetchAdminJobs,
    retry: false,
  });

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["admin-candidates", parsedJobId ?? "all"],
    queryFn: () => fetchAdminCandidates(parsedJobId),
    retry: false,
  });

  const { data: selectedCandidate, isLoading: isCandidateLoading } = useQuery({
    queryKey: ["admin-candidate", selectedCandidateId],
    queryFn: () => fetchAdminCandidate(selectedCandidateId as number),
    enabled: selectedCandidateId !== null,
    retry: false,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Candidate pipeline visibility</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review applied candidates by role, inspect AI summaries and interviews, and use score thresholds to make hiring decisions faster.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <label className="mb-2 block text-sm font-medium">Filter by job</label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger>
              <SelectValue placeholder="All jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.job_id} value={String(job.job_id)}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Applied candidates</h2>
            <p className="text-sm text-muted-foreground">Filter the pipeline by job and drill into transcript-level details.</p>
          </div>
          <Badge variant="outline">{candidates.length} candidates</Badge>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Loading candidate pipeline...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Applied For</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.candidate_id} className="cursor-pointer" onClick={() => setSelectedCandidateId(candidate.candidate_id)}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {candidate.first_name} {candidate.last_name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {candidate.score_breakdown.length} graded answer{candidate.score_breakdown.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                  <TableCell>{candidate.job_position}</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">{candidate.screening_score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={recommendationClasses(candidate.recommendation_label)}>
                      {candidate.recommendation_label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(candidate.applied_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelectedCandidateId(candidate.candidate_id)}>
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={selectedCandidateId !== null} onOpenChange={(open) => !open && setSelectedCandidateId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Candidate Detail</DialogTitle>
            <DialogDescription>CV summary, interview transcript, score breakdown, and final recommendation.</DialogDescription>
          </DialogHeader>

          {isCandidateLoading || !selectedCandidate ? (
            <div className="rounded-2xl border bg-muted/30 p-6 text-sm text-muted-foreground">Loading candidate detail...</div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedCandidate.first_name} {selectedCandidate.last_name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedCandidate.email} · {selectedCandidate.job_position}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={recommendationClasses(selectedCandidate.recommendation_label)}>
                    {selectedCandidate.recommendation_label}
                  </Badge>
                  <div className="rounded-xl border bg-card px-4 py-2 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Score</p>
                    <p className="mt-1 text-2xl font-semibold">{selectedCandidate.screening_score}</p>
                  </div>
                </div>
              </div>

              <section className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-primary" />
                  CV Summary
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedCandidate.cv_summary}</p>
              </section>

              <section className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Star className="h-4 w-4 text-primary" />
                  Score Breakdown
                </div>
                <div className="mt-4 space-y-3">
                  {selectedCandidate.score_breakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No per-question scores are available yet for this candidate.</p>
                  ) : (
                    selectedCandidate.score_breakdown.map((item, index) => (
                      <div key={`${item.question}-${index}`} className="rounded-2xl border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-medium">{item.question}</p>
                          <Badge variant="outline">{item.score}/10</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{item.justification || "No justification provided."}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                  Interview Transcript
                </div>
                <div className="mt-4 space-y-4">
                  {selectedCandidate.interview_transcript.map((item, index) => (
                    <div key={`${item.question}-${index}`} className="space-y-2">
                      <div className="rounded-2xl rounded-tl-md border bg-muted/20 px-4 py-3 text-sm">{item.question}</div>
                      <div className="ml-auto rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm text-primary-foreground">
                        {item.answer || "Awaiting response."}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
