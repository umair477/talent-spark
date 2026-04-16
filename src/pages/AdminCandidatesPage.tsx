import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { CalendarClock, CalendarDays, CheckCircle2, Eye, FileText, MailCheck, MessageSquareText, RefreshCw, Send, Star, XCircle } from "lucide-react";
import {
  cancelAdminInterview,
  createInterviewBookingRequest,
  fetchAdminCandidate,
  fetchAdminCandidates,
  fetchAdminEmployees,
  fetchAdminInterviews,
  fetchAdminJobs,
  fetchInterviewAvailableSlots,
  markAdminInterviewCompleted,
  resendAdminInterviewInvite,
  rescheduleAdminInterview,
  type AdminCandidate,
  type InterviewAvailableSlot,
  type InterviewBookingRecord,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

function interviewStatusClasses(status: InterviewBookingRecord["status"]) {
  switch (status) {
    case "pending_booking":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "booked":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "expired":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-violet-200 bg-violet-50 text-violet-700";
  }
}

const interviewFormats = ["In-Person", "Google Meet", "Teams", "Phone"] as const;
const durationOptions = [30, 45, 60] as const;

function toDateInput(daysOffset: number) {
  return format(addDays(new Date(), daysOffset), "yyyy-MM-dd");
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export default function AdminCandidatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"candidates" | "interviews">("candidates");
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  const [scheduleCandidate, setScheduleCandidate] = useState<AdminCandidate | null>(null);
  const [dateFrom, setDateFrom] = useState(toDateInput(1));
  const [dateTo, setDateTo] = useState(toDateInput(7));
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [interviewFormat, setInterviewFormat] = useState<(typeof interviewFormats)[number]>("Google Meet");
  const [locationOrLink, setLocationOrLink] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<number[]>([]);
  const [availableSlots, setAvailableSlots] = useState<InterviewAvailableSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [scheduleError, setScheduleError] = useState("");

  const [rescheduleInterviewTarget, setRescheduleInterviewTarget] = useState<InterviewBookingRecord | null>(null);
  const [rescheduleDateFrom, setRescheduleDateFrom] = useState(toDateInput(1));
  const [rescheduleDateTo, setRescheduleDateTo] = useState(toDateInput(7));
  const [rescheduleDurationMinutes, setRescheduleDurationMinutes] = useState<number>(45);
  const [rescheduleFormat, setRescheduleFormat] = useState<string>("Google Meet");
  const [rescheduleLocation, setRescheduleLocation] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleSelectedInterviewerIds, setRescheduleSelectedInterviewerIds] = useState<number[]>([]);
  const [rescheduleSlots, setRescheduleSlots] = useState<InterviewAvailableSlot[]>([]);
  const [rescheduleSelectedSlotIds, setRescheduleSelectedSlotIds] = useState<string[]>([]);
  const [rescheduleError, setRescheduleError] = useState("");

  const [cancelTarget, setCancelTarget] = useState<InterviewBookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [viewInterviewTarget, setViewInterviewTarget] = useState<InterviewBookingRecord | null>(null);

  const parsedJobId = selectedJobId === "all" ? undefined : Number(selectedJobId);

  const { data: jobs = [] } = useQuery({
    queryKey: ["admin-jobs", "filter-options"],
    queryFn: fetchAdminJobs,
    retry: false,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["admin-employees", "interviewer-options"],
    queryFn: fetchAdminEmployees,
    retry: false,
  });

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["admin-candidates", parsedJobId ?? "all"],
    queryFn: () => fetchAdminCandidates(parsedJobId),
    retry: false,
  });

  const { data: interviews = [], isLoading: isInterviewsLoading } = useQuery({
    queryKey: ["admin-interviews"],
    queryFn: fetchAdminInterviews,
    retry: false,
  });

  const { data: selectedCandidate, isLoading: isCandidateLoading } = useQuery({
    queryKey: ["admin-candidate", selectedCandidateId],
    queryFn: () => fetchAdminCandidate(selectedCandidateId as number),
    enabled: selectedCandidateId !== null,
    retry: false,
  });

  const findSlotsMutation = useMutation({
    mutationFn: () =>
      fetchInterviewAvailableSlots({
        date_from: dateFrom,
        date_to: dateTo,
        duration_minutes: durationMinutes,
        format: interviewFormat,
      }),
    onSuccess: (payload) => {
      setAvailableSlots(payload.slots);
      setSelectedSlotIds([]);
      setScheduleError("");
    },
    onError: (error) => {
      setScheduleError(error instanceof Error ? error.message : "Unable to fetch available slots.");
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: (candidate: AdminCandidate) => {
      const selected = availableSlots.filter((slot) => selectedSlotIds.includes(slot.slot_id));
      return createInterviewBookingRequest({
        candidate_id: candidate.candidate_id,
        job_id: candidate.job_id,
        proposed_slots: selected.map((slot) => ({ start: slot.start, end: slot.end })),
        format: interviewFormat,
        location_or_link: locationOrLink,
        interviewer_ids: selectedInterviewerIds,
        notes: additionalNotes,
      });
    },
    onSuccess: async (payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-candidates"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-interviews"] }),
      ]);
      toast({
        title: payload.email_sent ? "Scheduling email sent" : "Booking request created",
        description: payload.email_sent
          ? "The candidate received a self-booking link."
          : `Email delivery failed, but the booking request is ready: ${payload.booking_url}`,
      });
      setScheduleCandidate(null);
    },
    onError: (error) => {
      setScheduleError(error instanceof Error ? error.message : "Unable to create booking request.");
    },
  });

  const findRescheduleSlotsMutation = useMutation({
    mutationFn: () =>
      fetchInterviewAvailableSlots({
        date_from: rescheduleDateFrom,
        date_to: rescheduleDateTo,
        duration_minutes: rescheduleDurationMinutes,
        format: rescheduleFormat,
      }),
    onSuccess: (payload) => {
      setRescheduleSlots(payload.slots);
      setRescheduleSelectedSlotIds([]);
      setRescheduleError("");
    },
    onError: (error) => {
      setRescheduleError(error instanceof Error ? error.message : "Unable to fetch available slots.");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (interview: InterviewBookingRecord) => {
      const selected = rescheduleSlots.filter((slot) => rescheduleSelectedSlotIds.includes(slot.slot_id));
      return rescheduleAdminInterview({
        interview_id: interview.interview_id,
        new_proposed_slots: selected.map((slot) => ({ start: slot.start, end: slot.end })),
        format: rescheduleFormat,
        location_or_link: rescheduleLocation,
        interviewer_ids: rescheduleSelectedInterviewerIds,
        notes: rescheduleNotes,
      });
    },
    onSuccess: async (payload) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-interviews"] });
      toast({
        title: payload.email_sent ? "Interview rescheduled" : "Interview updated",
        description: payload.email_sent
          ? "A fresh self-booking link was sent to the candidate."
          : `Rescheduled, but email failed. Booking URL: ${payload.booking_url}`,
      });
      setRescheduleInterviewTarget(null);
    },
    onError: (error) => {
      setRescheduleError(error instanceof Error ? error.message : "Unable to reschedule interview.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: { interviewId: number; reason: string }) => cancelAdminInterview(payload.interviewId, payload.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-interviews"] });
      toast({
        title: "Interview cancelled",
        description: "Candidate cancellation email has been sent.",
      });
      setCancelTarget(null);
      setCancelReason("");
    },
    onError: (error) => {
      toast({
        title: "Cancellation failed",
        description: error instanceof Error ? error.message : "Unable to cancel this interview.",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (interviewId: number) => resendAdminInterviewInvite(interviewId),
    onSuccess: async (payload) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-interviews"] });
      toast({
        title: payload.email_sent ? "Invite resent" : "Invite refreshed",
        description: payload.email_sent
          ? "A new scheduling link was sent to the candidate."
          : `Invite regenerated, but email failed. URL: ${payload.booking_url}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Resend failed",
        description: error instanceof Error ? error.message : "Unable to resend invite.",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (interviewId: number) => markAdminInterviewCompleted(interviewId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-interviews"] });
      toast({
        title: "Interview completed",
        description: "Status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to update status",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const minDate = useMemo(() => toDateInput(1), []);

  const openScheduleModal = (candidate: AdminCandidate) => {
    setScheduleCandidate(candidate);
    setDateFrom(toDateInput(1));
    setDateTo(toDateInput(7));
    setDurationMinutes(45);
    setInterviewFormat("Google Meet");
    setLocationOrLink("");
    setAdditionalNotes("");
    setSelectedInterviewerIds([]);
    setAvailableSlots([]);
    setSelectedSlotIds([]);
    setScheduleError("");
  };

  const openRescheduleModal = (interview: InterviewBookingRecord) => {
    setRescheduleInterviewTarget(interview);
    setRescheduleDateFrom(toDateInput(1));
    setRescheduleDateTo(toDateInput(7));
    setRescheduleDurationMinutes(45);
    setRescheduleFormat(interview.format || "Google Meet");
    setRescheduleLocation(interview.location_or_link || "");
    setRescheduleNotes(interview.notes || "");
    setRescheduleSelectedInterviewerIds(interview.interviewer_ids ?? []);
    setRescheduleSlots([]);
    setRescheduleSelectedSlotIds([]);
    setRescheduleError("");
  };

  const toggleSlot = (slotId: string) => {
    setSelectedSlotIds((current) => {
      if (current.includes(slotId)) {
        return current.filter((item) => item !== slotId);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, slotId];
    });
  };

  const toggleRescheduleSlot = (slotId: string) => {
    setRescheduleSelectedSlotIds((current) => {
      if (current.includes(slotId)) {
        return current.filter((item) => item !== slotId);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, slotId];
    });
  };

  const toggleInterviewer = (employeeId: number) => {
    setSelectedInterviewerIds((current) =>
      current.includes(employeeId) ? current.filter((id) => id !== employeeId) : [...current, employeeId],
    );
  };

  const toggleRescheduleInterviewer = (employeeId: number) => {
    setRescheduleSelectedInterviewerIds((current) =>
      current.includes(employeeId) ? current.filter((id) => id !== employeeId) : [...current, employeeId],
    );
  };

  const canSendSchedule = selectedSlotIds.length >= 2 && selectedSlotIds.length <= 3 && locationOrLink.trim().length > 0;
  const canSendReschedule =
    rescheduleSelectedSlotIds.length >= 1 && rescheduleSelectedSlotIds.length <= 3 && rescheduleLocation.trim().length > 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Candidate and interview management</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Propose interview slots, send secure self-booking links, and monitor confirmations from one workspace.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <label className="mb-2 block text-sm font-medium">Filter candidates by job</label>
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "candidates" | "interviews")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="candidates" className="gap-2">
            <Send className="h-4 w-4" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="interviews" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Interviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-4">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Applied candidates</h2>
                <p className="text-sm text-muted-foreground">Select shortlisted candidates and send interview slot options.</p>
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                            onClick={() => openScheduleModal(candidate)}
                          >
                            Schedule Interview
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-4">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Interview tracking</h2>
                <p className="text-sm text-muted-foreground">Monitor pending bookings, confirmations, cancellations, and completed interviews.</p>
              </div>
              <Badge variant="outline">{interviews.length} records</Badge>
            </div>

            {isInterviewsLoading ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">Loading interviews...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Interview Date</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => {
                    const interviewDate = interview.selected_slot_start ?? interview.proposed_slots[0]?.start ?? null;
                    return (
                      <TableRow key={interview.interview_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{interview.candidate_name}</p>
                            <p className="text-xs text-muted-foreground">{interview.candidate_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{interview.job_title}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(interviewDate)}</TableCell>
                        <TableCell>{interview.format}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={interviewStatusClasses(interview.status)}>
                            {interview.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setViewInterviewTarget(interview)}>
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={interview.status === "completed" || interview.status === "cancelled"}
                              onClick={() => openRescheduleModal(interview)}
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={interview.status === "completed" || interview.status === "cancelled"}
                              onClick={() => {
                                setCancelTarget(interview);
                                setCancelReason("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={interview.status !== "booked"}
                              onClick={() => completeMutation.mutate(interview.interview_id)}
                            >
                              Mark as Completed
                            </Button>
                            {interview.status === "expired" ? (
                              <Button variant="outline" size="sm" onClick={() => resendMutation.mutate(interview.interview_id)}>
                                Resend Invite
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

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

      <Dialog open={scheduleCandidate !== null} onOpenChange={(open) => !open && setScheduleCandidate(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Select a date range, fetch available slots, and send 2-3 options through a secure self-booking link.
            </DialogDescription>
          </DialogHeader>

          {!scheduleCandidate ? null : (
            <div className="space-y-5">
              <section className="space-y-4 rounded-2xl border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold">Step 1 - Define Preferences</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_from">Date from</Label>
                    <Input id="date_from" type="date" min={minDate} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_to">Date to</Label>
                    <Input id="date_to" type="date" min={dateFrom || minDate} value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={String(durationMinutes)} onValueChange={(value) => setDurationMinutes(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((duration) => (
                          <SelectItem key={duration} value={String(duration)}>
                            {duration} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Interview format</Label>
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
                    <Label htmlFor="location_link">Location / Link</Label>
                    <Input
                      id="location_link"
                      value={locationOrLink}
                      onChange={(event) => setLocationOrLink(event.target.value)}
                      placeholder="Office address or meeting URL"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Interviewers</Label>
                  <div className="grid max-h-36 gap-2 overflow-y-auto rounded-xl border bg-card p-3 md:grid-cols-2">
                    {employees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No interviewer records found.</p>
                    ) : (
                      employees.map((employee) => (
                        <label key={employee.employee_id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedInterviewerIds.includes(employee.employee_id)}
                            onCheckedChange={() => toggleInterviewer(employee.employee_id)}
                          />
                          <span>
                            {employee.full_name} · {employee.designation || "Employee"}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={findSlotsMutation.isPending || !dateFrom || !dateTo}
                  onClick={() => {
                    if (dateTo < dateFrom) {
                      setScheduleError("Date to must be on or after date from.");
                      return;
                    }
                    findSlotsMutation.mutate();
                  }}
                >
                  <CalendarDays className="h-4 w-4" />
                  Find Available Slots
                </Button>
              </section>

              <section className="space-y-4 rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Step 2 - Select 2 to 3 Slots</h3>
                {findSlotsMutation.isPending ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">Checking calendar availability...</div>
                ) : null}

                {availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No slots yet. Click "Find Available Slots" first.</p>
                ) : (
                  <div className="grid gap-3">
                    {availableSlots.map((slot) => {
                      const selected = selectedSlotIds.includes(slot.slot_id);
                      return (
                        <button
                          key={slot.slot_id}
                          type="button"
                          className={cn(
                            "rounded-2xl border p-4 text-left transition",
                            selected ? "border-sky-400 bg-sky-50" : "border-border bg-background hover:bg-muted/40",
                          )}
                          onClick={() => toggleSlot(slot.slot_id)}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium">{slot.formatted_display}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{slot.day_of_week}</p>
                            </div>
                            <Badge variant="outline">{selected ? "Selected" : "Select"}</Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">Selected: {selectedSlotIds.length}/3</p>
              </section>

              <section className="space-y-2 rounded-2xl border bg-card p-4">
                <Label htmlFor="schedule_notes">Additional notes (optional)</Label>
                <Textarea
                  id="schedule_notes"
                  value={additionalNotes}
                  onChange={(event) => setAdditionalNotes(event.target.value)}
                  placeholder="Share preparation notes or expectations"
                />
              </section>

              {scheduleError ? <p className="text-sm text-destructive">{scheduleError}</p> : null}

              <DialogFooter>
                <Button variant="outline" onClick={() => setScheduleCandidate(null)}>
                  Cancel
                </Button>
                <Button
                  className="gap-2"
                  disabled={!canSendSchedule || createBookingMutation.isPending}
                  onClick={() => {
                    if (!scheduleCandidate) return;
                    if (!canSendSchedule) {
                      setScheduleError("Choose 2-3 slots and add location/link before sending.");
                      return;
                    }
                    createBookingMutation.mutate(scheduleCandidate);
                  }}
                >
                  <Send className="h-4 w-4" />
                  Send Scheduling Email
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleInterviewTarget !== null} onOpenChange={(open) => !open && setRescheduleInterviewTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <DialogDescription>
              Find fresh availability, choose new slot options, and send an updated booking link.
            </DialogDescription>
          </DialogHeader>

          {!rescheduleInterviewTarget ? null : (
            <div className="space-y-5">
              <section className="space-y-4 rounded-2xl border bg-muted/20 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reschedule_date_from">Date from</Label>
                    <Input
                      id="reschedule_date_from"
                      type="date"
                      min={minDate}
                      value={rescheduleDateFrom}
                      onChange={(event) => setRescheduleDateFrom(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reschedule_date_to">Date to</Label>
                    <Input
                      id="reschedule_date_to"
                      type="date"
                      min={rescheduleDateFrom || minDate}
                      value={rescheduleDateTo}
                      onChange={(event) => setRescheduleDateTo(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={String(rescheduleDurationMinutes)} onValueChange={(value) => setRescheduleDurationMinutes(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((duration) => (
                          <SelectItem key={duration} value={String(duration)}>
                            {duration} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Interview format</Label>
                    <Select value={rescheduleFormat} onValueChange={setRescheduleFormat}>
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
                    <Label htmlFor="reschedule_location">Location / Link</Label>
                    <Input
                      id="reschedule_location"
                      value={rescheduleLocation}
                      onChange={(event) => setRescheduleLocation(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Interviewers</Label>
                  <div className="grid max-h-36 gap-2 overflow-y-auto rounded-xl border bg-card p-3 md:grid-cols-2">
                    {employees.map((employee) => (
                      <label key={employee.employee_id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={rescheduleSelectedInterviewerIds.includes(employee.employee_id)}
                          onCheckedChange={() => toggleRescheduleInterviewer(employee.employee_id)}
                        />
                        <span>
                          {employee.full_name} · {employee.designation || "Employee"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={findRescheduleSlotsMutation.isPending || !rescheduleDateFrom || !rescheduleDateTo}
                  onClick={() => {
                    if (rescheduleDateTo < rescheduleDateFrom) {
                      setRescheduleError("Date to must be on or after date from.");
                      return;
                    }
                    findRescheduleSlotsMutation.mutate();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Find New Slots
                </Button>
              </section>

              <section className="space-y-4 rounded-2xl border bg-card p-4">
                {rescheduleSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No slots yet. Click "Find New Slots" first.</p>
                ) : (
                  <div className="grid gap-3">
                    {rescheduleSlots.map((slot) => {
                      const selected = rescheduleSelectedSlotIds.includes(slot.slot_id);
                      return (
                        <button
                          key={slot.slot_id}
                          type="button"
                          className={cn(
                            "rounded-2xl border p-4 text-left transition",
                            selected ? "border-sky-400 bg-sky-50" : "border-border bg-background hover:bg-muted/40",
                          )}
                          onClick={() => toggleRescheduleSlot(slot.slot_id)}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium">{slot.formatted_display}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{slot.day_of_week}</p>
                            </div>
                            <Badge variant="outline">{selected ? "Selected" : "Select"}</Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Selected: {rescheduleSelectedSlotIds.length}/3</p>
              </section>

              <section className="space-y-2 rounded-2xl border bg-card p-4">
                <Label htmlFor="reschedule_notes">Additional notes (optional)</Label>
                <Textarea
                  id="reschedule_notes"
                  value={rescheduleNotes}
                  onChange={(event) => setRescheduleNotes(event.target.value)}
                />
              </section>

              {rescheduleError ? <p className="text-sm text-destructive">{rescheduleError}</p> : null}

              <DialogFooter>
                <Button variant="outline" onClick={() => setRescheduleInterviewTarget(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={!canSendReschedule || rescheduleMutation.isPending}
                  onClick={() => {
                    if (!rescheduleInterviewTarget) return;
                    if (!canSendReschedule) {
                      setRescheduleError("Select at least one slot and add location/link before rescheduling.");
                      return;
                    }
                    rescheduleMutation.mutate(rescheduleInterviewTarget);
                  }}
                >
                  Send Updated Invite
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Interview</DialogTitle>
            <DialogDescription>Provide a short reason. The candidate will receive a cancellation email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel_reason">Reason</Label>
            <Textarea id="cancel_reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep Interview
            </Button>
            <Button
              variant="destructive"
              disabled={!cancelTarget || cancelReason.trim().length < 2 || cancelMutation.isPending}
              onClick={() => {
                if (!cancelTarget) return;
                cancelMutation.mutate({ interviewId: cancelTarget.interview_id, reason: cancelReason.trim() });
              }}
            >
              Cancel Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewInterviewTarget !== null} onOpenChange={(open) => !open && setViewInterviewTarget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interview Detail</DialogTitle>
            <DialogDescription>Booking, slot, and coordination details.</DialogDescription>
          </DialogHeader>

          {!viewInterviewTarget ? null : (
            <div className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Candidate</p>
                  <p className="mt-2 font-medium">{viewInterviewTarget.candidate_name}</p>
                  <p className="text-muted-foreground">{viewInterviewTarget.candidate_email}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                  <Badge variant="outline" className={cn("mt-2", interviewStatusClasses(viewInterviewTarget.status))}>
                    {viewInterviewTarget.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <p className="font-medium">{viewInterviewTarget.job_title}</p>
                <p className="text-muted-foreground">Format: {viewInterviewTarget.format}</p>
                <p className="text-muted-foreground">Location/Link: {viewInterviewTarget.meet_link || viewInterviewTarget.location_or_link || "TBD"}</p>
                <p className="text-muted-foreground">Token expiry: {formatDateTime(viewInterviewTarget.token_expires_at)}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Proposed Slots</p>
                {viewInterviewTarget.proposed_slots.length === 0 ? (
                  <p className="text-muted-foreground">No proposed slots stored.</p>
                ) : (
                  viewInterviewTarget.proposed_slots.map((slot, index) => (
                    <div key={`${slot.start}-${index}`} className="rounded-xl border p-3">
                      <p>{formatDateTime(slot.start)} - {formatDateTime(slot.end)}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                <MailCheck className="h-4 w-4" />
                Created: {formatDateTime(viewInterviewTarget.created_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4 text-amber-600" />
            Pending Booking
          </div>
          <p className="mt-2 text-3xl font-semibold">{interviews.filter((item) => item.status === "pending_booking").length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-sky-600" />
            Booked
          </div>
          <p className="mt-2 text-3xl font-semibold">{interviews.filter((item) => item.status === "booked").length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <XCircle className="h-4 w-4 text-rose-600" />
            Cancelled / Expired
          </div>
          <p className="mt-2 text-3xl font-semibold">
            {interviews.filter((item) => item.status === "cancelled" || item.status === "expired").length}
          </p>
        </div>
      </div>
    </div>
  );
}
