import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, FileText, MailCheck, MessageSquareText, Send, Sparkles, Star } from "lucide-react";
import {
  fetchAdminCandidate,
  fetchAdminCandidates,
  fetchAdminJobs,
  generateInterviewEmailDraft,
  sendInterviewEmail,
  type AdminCandidate,
} from "@/lib/api";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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

const interviewFormats = [
  "In-Person",
  "Video Call (Zoom)",
  "Video Call (Google Meet)",
  "Phone Call",
] as const;

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function AdminCandidatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  const [emailCandidate, setEmailCandidate] = useState<AdminCandidate | null>(null);
  const [interviewDate, setInterviewDate] = useState(tomorrowDate());
  const [interviewTime, setInterviewTime] = useState("10:00");
  const [interviewFormat, setInterviewFormat] = useState<(typeof interviewFormats)[number]>(interviewFormats[0]);
  const [locationOrLink, setLocationOrLink] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emailError, setEmailError] = useState("");

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

  const generateMutation = useMutation({
    mutationFn: (candidateId: number) =>
      generateInterviewEmailDraft(candidateId, {
        interview_date: interviewDate,
        interview_time: interviewTime,
        interview_format: interviewFormat,
        location_or_link: locationOrLink,
        additional_notes: additionalNotes,
      }),
    onSuccess: (draft) => {
      setToEmail(draft.to_email);
      setSubject(draft.subject);
      setBody(draft.body);
      setEmailError("");
    },
    onError: (error) => {
      setEmailError(error instanceof Error ? error.message : "Unable to generate interview email.");
    },
  });

  const sendMutation = useMutation({
    mutationFn: (candidateId: number) =>
      sendInterviewEmail(candidateId, {
        to_email: toEmail,
        subject,
        body,
        interview_date: interviewDate,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-candidates"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-candidate", selectedCandidateId] }),
      ]);
      toast({
        title: "Interview invitation sent",
        description: "The candidate has been emailed successfully.",
      });
      setEmailCandidate(null);
      setEmailError("");
    },
    onError: (error) => {
      setEmailError(error instanceof Error ? error.message : "Unable to send interview email.");
    },
  });

  const minDate = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    return now.toISOString().slice(0, 10);
  }, []);

  const openInterviewModal = (candidate: AdminCandidate) => {
    setEmailCandidate(candidate);
    setInterviewDate(tomorrowDate());
    setInterviewTime("10:00");
    setInterviewFormat(interviewFormats[0]);
    setLocationOrLink("");
    setAdditionalNotes("");
    setToEmail(candidate.email);
    setSubject("");
    setBody("");
    setEmailError("");
  };

  const isDraftReady = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Candidate pipeline visibility</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review applied candidates by role, inspect AI summaries and interviews, and send interview invitations with
            AI-generated drafts.
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
            <p className="text-sm text-muted-foreground">Filter by role, inspect details, and notify shortlisted candidates.</p>
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
                <TableRow key={candidate.candidate_id}>
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
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelectedCandidateId(candidate.candidate_id)}>
                        <Eye className="h-4 w-4" />
                        View
                      </Button>

                      {candidate.interview_email_sent ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          Sent ✓
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                          onClick={() => openInterviewModal(candidate)}
                        >
                          Send Interview Email
                        </Button>
                      )}
                    </div>
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

      <Dialog open={emailCandidate !== null} onOpenChange={(open) => !open && setEmailCandidate(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Send Interview Email</DialogTitle>
            <DialogDescription>Choose interview details, generate an AI draft, and send after review.</DialogDescription>
          </DialogHeader>

          {!emailCandidate ? null : (
            <div className="space-y-5">
              <section className="space-y-4 rounded-2xl border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold">Section A - Date & Time</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="interview_date">Interview Date</Label>
                    <Input
                      id="interview_date"
                      type="date"
                      min={minDate}
                      value={interviewDate}
                      onChange={(event) => setInterviewDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interview_time">Interview Time</Label>
                    <Input
                      id="interview_time"
                      type="time"
                      value={interviewTime}
                      onChange={(event) => setInterviewTime(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Interview Format</Label>
                    <Select
                      value={interviewFormat}
                      onValueChange={(value: (typeof interviewFormats)[number]) => setInterviewFormat(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {interviewFormats.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_or_link">Interview Location / Link</Label>
                    <Input
                      id="location_or_link"
                      value={locationOrLink}
                      onChange={(event) => setLocationOrLink(event.target.value)}
                      placeholder="Office address or meeting link"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Additional Notes for Candidate (Optional)</Label>
                  <Textarea
                    id="additional_notes"
                    value={additionalNotes}
                    onChange={(event) => setAdditionalNotes(event.target.value)}
                    placeholder="Anything the candidate should prepare in advance"
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Section B - AI Email Preview</h3>
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={!emailCandidate || !locationOrLink.trim() || generateMutation.isPending}
                    onClick={() => {
                      if (!emailCandidate) return;
                      if (!interviewDate || interviewDate < minDate) {
                        setEmailError("Interview date must be a future date.");
                        return;
                      }
                      generateMutation.mutate(emailCandidate.candidate_id);
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Email
                  </Button>
                </div>

                {generateMutation.isPending ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                    AI is drafting your email...
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="to_email">To</Label>
                  <Input id="to_email" value={toEmail} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Body</Label>
                  <Textarea
                    id="body"
                    className="min-h-[260px]"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                  />
                </div>

                {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
              </section>

              <section className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailCandidate(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  disabled={!emailCandidate || !locationOrLink.trim() || generateMutation.isPending}
                  onClick={() => {
                    if (!emailCandidate) return;
                    if (!interviewDate || interviewDate < minDate) {
                      setEmailError("Interview date must be a future date.");
                      return;
                    }
                    generateMutation.mutate(emailCandidate.candidate_id);
                  }}
                >
                  Regenerate
                </Button>
                <Button
                  className="gap-2"
                  disabled={!emailCandidate || !isDraftReady || sendMutation.isPending}
                  onClick={() => {
                    if (!emailCandidate) return;
                    sendMutation.mutate(emailCandidate.candidate_id);
                  }}
                >
                  <Send className="h-4 w-4" />
                  Send Email
                </Button>
              </section>

              {emailCandidate.interview_email_sent_at ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <MailCheck className="h-4 w-4" />
                  Last sent on {format(new Date(emailCandidate.interview_email_sent_at), "MMM d, yyyy h:mm a")}
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
