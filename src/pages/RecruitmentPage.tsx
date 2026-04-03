import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Send, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { fetchCandidates, scoreResume, submitInterviewAnswer, type Candidate } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

function getScoreReason(score: number): string {
  if (score >= 90) return "Excellent skill match, strong interview performance, and relevant experience align closely with role requirements.";
  if (score >= 70) return "Good foundational skills with some gaps in specialized areas. Could benefit from mentorship in key competencies.";
  return "Significant gaps in required skills or experience. Interview revealed areas needing substantial development.";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "hsl(var(--success))";
  if (score >= 70) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function getStatusVariant(status: string) {
  switch (status) {
    case "Shortlisted": return "bg-success/10 text-success border-success/20";
    case "Interview Scheduled": return "bg-primary/10 text-primary border-primary/20";
    case "Under Review": return "bg-warning/10 text-warning border-warning/20";
    case "Rejected": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "";
  }
}

function getInterviewStatusLabel(status: Candidate["interview_status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    default:
      return "Pending";
  }
}

function getInterviewStatusVariant(status: Candidate["interview_status"]): string {
  switch (status) {
    case "completed":
      return "bg-success/10 text-success border-success/20";
    case "in_progress":
      return "bg-primary/10 text-primary border-primary/20";
    default:
      return "bg-warning/10 text-warning border-warning/20";
  }
}

function CircularScore({ score, size = 40 }: { score: number; size?: number }) {
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative cursor-help" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{score}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[220px] text-xs">
        <p className="mb-1 font-medium" style={{ color }}>{score}% Match</p>
        <p className="text-muted-foreground">{getScoreReason(score)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function RecruitmentPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: fetchCandidates,
  });

  useEffect(() => {
    if (!selected) return;
    const updatedCandidate = candidates.find((candidate) => candidate.id === selected.id);
    if (updatedCandidate) {
      setSelected(updatedCandidate);
    }
  }, [candidates, selected]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!resumeFile) {
        throw new Error("Resume file is required.");
      }
      const formData = new FormData();
      formData.append("candidate_name", candidateName);
      formData.append("email", candidateEmail);
      formData.append("role_title", roleTitle);
      formData.append("job_description", jobDescription);
      formData.append("resume", resumeFile);
      return scoreResume(formData);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setSelected(result.candidate);
      setCandidateName("");
      setCandidateEmail("");
      setRoleTitle("");
      setJobDescription("");
      setResumeFile(null);
      setInterviewAnswer("");
      toast({
        title: "Interview session created",
        description: `Resume scored and interview started for ${result.candidate.name}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to score resume",
        description: error instanceof Error ? error.message : "Check the backend configuration.",
        variant: "destructive",
      });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      if (!selected) {
        throw new Error("Select a candidate first.");
      }
      return submitInterviewAnswer(selected.id, interviewAnswer.trim());
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setSelected(result.candidate);
      setInterviewAnswer("");
      toast({
        title: "Interview answer graded",
        description: result.next_question
          ? "The next interview question is ready."
          : "Interview completed and the match score has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to submit answer",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const filtered = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.role_title.toLowerCase().includes(search.toLowerCase())
  );

  const currentQuestion =
    selected && selected.current_question_index < selected.screening_questions.length
      ? selected.screening_questions[selected.current_question_index]
      : null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="flex min-w-0 flex-1 flex-col p-6">
        <div className="mb-6 space-y-4 rounded-2xl border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">Resume Scoring Intake</h2>
            <p className="text-sm text-muted-foreground">
              Upload a candidate resume to create a live interview session with generated follow-up questions.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} placeholder="Candidate name" />
            <Input value={candidateEmail} onChange={(event) => setCandidateEmail(event.target.value)} placeholder="Candidate email" />
            <Input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="Role title" />
            <Input type="file" accept=".pdf,.txt" onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} />
          </div>
          <Textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the job description here..."
            className="min-h-[120px]"
          />
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!candidateName || !candidateEmail || !roleTitle || !jobDescription || !resumeFile || uploadMutation.isPending}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? "Scoring..." : "Score Resume"}
          </Button>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Recruitment Hub</h1>
            <p className="text-sm text-muted-foreground">{candidates.length} candidates in pipeline</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidates..."
              className="h-9 border-0 bg-secondary/50 pl-9 focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-xl border bg-card">
          <ScrollArea className="h-full">
            {isLoading && (
              <div className="p-6 text-sm text-muted-foreground">Loading candidates from the backend...</div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Candidate</TableHead>
                  <TableHead className="font-medium">Role</TableHead>
                  <TableHead className="font-medium">AI Match</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    onClick={() => setSelected(candidate)}
                    className={cn("cursor-pointer transition-colors", selected?.id === candidate.id && "bg-accent")}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {candidate.name.split(" ").map((name) => name[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{candidate.role_title}</TableCell>
                    <TableCell>
                      <CircularScore score={candidate.ai_score} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Badge variant="outline" className={cn("w-fit text-xs", getStatusVariant(candidate.status))}>
                          {candidate.status}
                        </Badge>
                        <Badge variant="outline" className={cn("w-fit text-xs", getInterviewStatusVariant(candidate.interview_status))}>
                          Interview {getInterviewStatusLabel(candidate.interview_status)}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>

      {selected && (
        <div className="flex w-[30rem] flex-col border-l bg-card animate-slide-in-right">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-sm font-semibold">Candidate Details</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {selected.name.split(" ").map((name) => name[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.role_title}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center rounded-xl bg-secondary/50 p-3">
                  <CircularScore score={selected.ai_score} size={56} />
                  <p className="mt-1 text-xs text-muted-foreground">Match Score</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Resume</p>
                  <p className="mt-2 text-lg font-semibold">{selected.resume_score}</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Interview</p>
                  <p className="mt-2 text-lg font-semibold">{selected.interview_score}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Interview State</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", getInterviewStatusVariant(selected.interview_status))}>
                    {getInterviewStatusLabel(selected.interview_status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selected.raw_answers.length} of {selected.screening_questions.length} answers submitted
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Interview Summary</h4>
                <p className="text-sm leading-relaxed">{selected.summary}</p>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Skim Insights</h4>
                <div className="space-y-2">
                  {selected.skim_insights.length > 0 ? (
                    selected.skim_insights.map((insight) => (
                      <div key={insight} className="rounded-xl border bg-secondary/40 px-3 py-2 text-sm">
                        {insight}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skim insights were stored for this candidate.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Dynamic Interview Questions</h4>
                <div className="space-y-3">
                  {selected.screening_questions.map((question, index) => {
                    const answer = selected.raw_answers[index];
                    const hasBeenAsked = index <= selected.current_question_index;
                    if (!hasBeenAsked && !answer) {
                      return null;
                    }

                    return (
                      <div key={`${question}-${index}`} className="space-y-2">
                        <div className="max-w-[90%] rounded-2xl rounded-tl-md border bg-secondary/50 px-3 py-2 text-sm">
                          {question}
                        </div>
                        {answer && (
                          <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                            <p>{answer.answer}</p>
                            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-primary-foreground/80">
                              <span>Score {answer.score}/10</span>
                              <span>{answer.source}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-primary-foreground/80">{answer.justification}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            {currentQuestion ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Submit the candidate’s next answer to update the interview score live.
                </p>
                <Textarea
                  value={interviewAnswer}
                  onChange={(event) => setInterviewAnswer(event.target.value)}
                  placeholder="Type the candidate's answer here..."
                  className="min-h-[110px]"
                />
                <Button
                  onClick={() => submitAnswerMutation.mutate()}
                  disabled={!interviewAnswer.trim() || submitAnswerMutation.isPending}
                  className="w-full"
                >
                  {submitAnswerMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {submitAnswerMutation.isPending ? "Grading Answer..." : "Submit Candidate Answer"}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success">
                Interview complete. The final weighted score is reflected in the dashboard.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
