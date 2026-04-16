import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarCheck2, CalendarDays, CheckCircle2, Clock3, Globe, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  confirmInterviewBooking,
  fetchInterviewBookingByToken,
  type BookingConfirmResponse,
  type InterviewAvailableSlot,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
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

function toFriendlyRange(startAt: string, endAt: string) {
  return `${format(new Date(startAt), "EEEE, MMM d, yyyy")} · ${format(new Date(startAt), "h:mm a")} - ${format(new Date(endAt), "h:mm a")}`;
}

function statusBadgeClass(status: string) {
  if (status === "booked") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "expired") return "border-slate-200 bg-slate-100 text-slate-700";
  if (status === "cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function InterviewBookingPage() {
  const { bookingToken = "" } = useParams();
  const browserTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Local", []);

  const [selectedSlot, setSelectedSlot] = useState<InterviewAvailableSlot | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<BookingConfirmResponse | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["interview-booking", bookingToken],
    queryFn: () => fetchInterviewBookingByToken(bookingToken),
    enabled: Boolean(bookingToken),
    retry: false,
  });

  const confirmMutation = useMutation({
    mutationFn: (slot: InterviewAvailableSlot) =>
      confirmInterviewBooking(bookingToken, {
        selected_slot_start: slot.start,
        selected_slot_end: slot.end,
      }),
    onSuccess: (payload) => {
      setConfirmedBooking(payload);
      setConfirmDialogOpen(false);
      setConfirmError("");
      refetch();
    },
    onError: (mutationError) => {
      setConfirmError(mutationError instanceof Error ? mutationError.message : "Unable to confirm this slot.");
    },
  });

  if (!bookingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
        <div className="rounded-3xl border bg-card p-6 text-sm text-muted-foreground">Missing booking token.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
        <div className="rounded-3xl border bg-card p-6 text-sm text-muted-foreground">Loading your interview options...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
        <div className="max-w-lg rounded-3xl border bg-card p-6 text-center">
          <p className="text-lg font-semibold">Unable to open this booking link</p>
          <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : "The link may be invalid."}</p>
        </div>
      </div>
    );
  }

  const currentStatus = confirmedBooking?.status ?? data.status;
  const selectedStart = confirmedBooking?.selected_slot_start ?? data.selected_slot_start;
  const selectedEnd = confirmedBooking?.selected_slot_end ?? data.selected_slot_end;
  const resolvedMeetLink = confirmedBooking?.meet_link ?? data.meet_link ?? data.location_or_link;
  const googleCalendarUrl = confirmedBooking?.google_calendar_url;
  const outlookCalendarUrl = confirmedBooking?.outlook_calendar_url;
  const icsUrl = confirmedBooking ? `${API_BASE_URL}${confirmedBooking.ics_download_url}` : `${API_BASE_URL}/api/interviews/booking/${bookingToken}/calendar.ics`;

  const isConfirmed = currentStatus === "booked" || currentStatus === "completed";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Interview Scheduling</p>
              <h1 className="mt-2 text-2xl font-semibold">{data.job_title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">Candidate: {data.candidate_name}</p>
            </div>
            <Badge variant="outline" className={statusBadgeClass(currentStatus)}>
              {currentStatus.replace("_", " ")}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Times shown in your local timezone: {browserTimezone}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {resolvedMeetLink || "Location details will be shared after booking"}
            </span>
          </div>
        </header>

        {currentStatus === "expired" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xl font-semibold">This scheduling link has expired.</p>
            <p className="mt-2 text-sm text-muted-foreground">Please contact HR at hr@company.com to request a new link.</p>
          </div>
        ) : null}

        {currentStatus === "cancelled" ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xl font-semibold">This interview request has been cancelled.</p>
            <p className="mt-2 text-sm text-muted-foreground">HR will contact you with next steps if needed.</p>
          </div>
        ) : null}

        {isConfirmed && selectedStart && selectedEnd ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
              <h2 className="text-2xl font-semibold">Interview Confirmed</h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-emerald-50/40 p-4">
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="mt-2 font-medium">{toFriendlyRange(selectedStart, selectedEnd)}</p>
              </div>
              <div className="rounded-2xl border bg-emerald-50/40 p-4">
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="mt-2 font-medium">{data.format}</p>
              </div>
            </div>

            {resolvedMeetLink ? (
              <p className="mt-4 text-sm">
                Join link: <a className="text-sky-700 underline" href={resolvedMeetLink} target="_blank" rel="noreferrer">{resolvedMeetLink}</a>
              </p>
            ) : null}

            <p className="mt-4 text-sm text-muted-foreground">A confirmation email has been sent to {data.candidate_email}.</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {googleCalendarUrl ? (
                <Button variant="outline" onClick={() => window.open(googleCalendarUrl, "_blank", "noopener,noreferrer")}>Google Calendar</Button>
              ) : null}
              {outlookCalendarUrl ? (
                <Button variant="outline" onClick={() => window.open(outlookCalendarUrl, "_blank", "noopener,noreferrer")}>Outlook</Button>
              ) : null}
              <Button variant="outline" onClick={() => window.open(icsUrl, "_blank", "noopener,noreferrer")}>.ics Download</Button>
            </div>
          </div>
        ) : null}

        {!isConfirmed && currentStatus !== "expired" && currentStatus !== "cancelled" ? (
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-semibold">Choose Your Slot</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Select one interview slot below and confirm to finalize your booking.
            </p>

            <div className="mt-5 grid gap-3">
              {data.proposed_slots.map((slot) => (
                <button
                  key={slot.slot_id}
                  type="button"
                  onClick={() => {
                    setSelectedSlot(slot);
                    setConfirmError("");
                    setConfirmDialogOpen(true);
                  }}
                  className="rounded-2xl border bg-muted/20 p-4 text-left transition hover:bg-sky-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-medium">{format(new Date(slot.start), "EEEE, MMMM d, yyyy")}</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        {format(new Date(slot.start), "h:mm a")} - {format(new Date(slot.end), "h:mm a")}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                      Choose This Slot
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Slot</DialogTitle>
            <DialogDescription>Review your selection before finalizing.</DialogDescription>
          </DialogHeader>

          {!selectedSlot ? null : (
            <div className="space-y-3">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">You are booking an interview for {data.job_title} on</p>
                <p className="mt-2 font-medium">{toFriendlyRange(selectedSlot.start, selectedSlot.end)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Format: {data.format}</p>
              </div>
              {confirmError ? <p className="text-sm text-destructive">{confirmError}</p> : null}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Go Back
            </Button>
            <Button
              className="gap-2"
              disabled={!selectedSlot || confirmMutation.isPending}
              onClick={() => {
                if (!selectedSlot) return;
                confirmMutation.mutate(selectedSlot);
              }}
            >
              <CalendarCheck2 className="h-4 w-4" />
              Confirm My Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
