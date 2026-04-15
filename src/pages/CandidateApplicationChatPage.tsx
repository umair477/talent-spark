import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Bot, Loader2, Send, Upload, UserRound } from "lucide-react";
import {
  chatCandidateApplication,
  fetchPublicJobListings,
  startCandidateApplication,
  submitCandidateApplication,
  uploadCandidateCv,
  type PublicJobListing,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CandidateStep = "first_name" | "last_name" | "email" | "upload_cv" | "screening" | "submitted";
type ChatRole = "bot" | "candidate";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

function makeMessage(role: ChatRole, content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content };
}

function isValidEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

function getInitialPrompt(jobTitle: string) {
  return (
    `Hi there! 👋 I'm the Hiring Assistant for Talent Spark. You're applying for the position of ${jobTitle}. ` +
    "Let's get started! What is your First Name?"
  );
}

export default function CandidateApplicationChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ jobId: string }>();
  const numericJobId = Number(params.jobId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<CandidateStep>("first_name");
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["public-job-listings"],
    queryFn: fetchPublicJobListings,
    retry: false,
  });

  const selectedJob: PublicJobListing | null = useMemo(() => {
    if (!Number.isFinite(numericJobId)) {
      return null;
    }
    return jobs.find((job) => job.job_id === numericJobId) ?? null;
  }, [jobs, numericJobId]);

  const selectedJobTitle =
    selectedJob?.title ||
    (location.state as { job_title?: string } | null)?.job_title ||
    "Selected Position";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!selectedJobTitle || messages.length > 0) {
      return;
    }
    setMessages([makeMessage("bot", getInitialPrompt(selectedJobTitle))]);
  }, [messages.length, selectedJobTitle]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((current) => [...current, message]);
  };

  const handleCandidateText = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed || isTyping || isUploadingCv || isSubmitting) {
      return;
    }

    appendMessage(makeMessage("candidate", trimmed));
    setInput("");

    if (step === "first_name") {
      setFirstName(trimmed);
      appendMessage(makeMessage("bot", "Great! What is your Last Name?"));
      setStep("last_name");
      return;
    }

    if (step === "last_name") {
      setLastName(trimmed);
      appendMessage(makeMessage("bot", "Thanks. What is your Email Address?"));
      setStep("email");
      return;
    }

    if (step === "email") {
      if (!isValidEmail(trimmed)) {
        appendMessage(makeMessage("bot", "That email looks invalid. Please enter a valid email address."));
        return;
      }
      setEmail(trimmed.toLowerCase());
      appendMessage(makeMessage("bot", "Great! Please upload your CV in PDF or DOCX format (max 5MB)."));
      setStep("upload_cv");
      return;
    }

    if (step === "upload_cv") {
      appendMessage(makeMessage("bot", "Please upload your CV file so we can continue."));
      return;
    }

    if (step !== "screening" || !sessionId) {
      return;
    }

    setIsTyping(true);
    try {
      const response = await chatCandidateApplication({
        session_id: sessionId,
        message: trimmed,
      });
      appendMessage(makeMessage("bot", response.reply));

      if (response.ready_for_submission) {
        setIsSubmitting(true);
        const submitResponse = await submitCandidateApplication(sessionId);
        appendMessage(makeMessage("bot", submitResponse.reply));
        setStep("submitted");
      }
    } catch (error) {
      appendMessage(
        makeMessage(
          "bot",
          error instanceof Error ? error.message : "Unable to continue the screening chat right now.",
        ),
      );
    } finally {
      setIsSubmitting(false);
      setIsTyping(false);
    }
  };

  const handleCvUpload = async (file: File | null) => {
    if (!file || !selectedJob) {
      return;
    }
    setIsUploadingCv(true);
    appendMessage(makeMessage("candidate", `Uploaded CV: ${file.name}`));
    setUploadedFileName(file.name);

    try {
      const cvResponse = await uploadCandidateCv({
        first_name: firstName,
        last_name: lastName,
        email,
        file,
      });
      appendMessage(makeMessage("bot", cvResponse.reply));

      const applyResponse = await startCandidateApplication(selectedJob.job_id, {
        first_name: firstName,
        last_name: lastName,
        email,
      });
      setSessionId(applyResponse.session_id);
      appendMessage(makeMessage("bot", applyResponse.reply));
      setStep("screening");
    } catch (error) {
      appendMessage(
        makeMessage(
          "bot",
          error instanceof Error
            ? error.message
            : "We could not process your CV. Please try uploading again.",
        ),
      );
    } finally {
      setIsUploadingCv(false);
    }
  };

  if (!Number.isFinite(numericJobId)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-3xl border bg-white p-8 text-sm text-muted-foreground shadow-sm">
          Invalid job link. Please return to the home page and select an open position.
        </div>
      </div>
    );
  }

  if (!jobsLoading && !selectedJob) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="space-y-4 rounded-3xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Position Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This position is no longer available. Please check currently open roles.
          </p>
          <Button onClick={() => navigate("/")}>Back to Open Positions</Button>
        </div>
      </div>
    );
  }

  if (step === "submitted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#ffffff_40%,_#dcfce7_100%)] p-6">
        <div className="w-full max-w-2xl rounded-[2rem] border bg-white p-8 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Application Received</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Thank You for Applying</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Your application for <span className="font-medium text-foreground">{selectedJobTitle}</span> has been submitted successfully.
            Our HR team will contact you at <span className="font-medium text-foreground">{email}</span> within 5–7 business days.
          </p>
          <Button className="mt-7" onClick={() => navigate("/")}>
            View Other Open Positions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#ffffff_45%,_#ecfdf5_100%)] p-4 md:p-6">
      <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border bg-white shadow-xl md:h-[calc(100vh-3rem)]">
        <header className="border-b px-5 py-4 md:px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Candidate Application</p>
          <h1 className="mt-1 text-xl font-semibold">{selectedJobTitle}</h1>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6">
          {messages.map((message) => {
            const isCandidate = message.role === "candidate";
            return (
              <div
                key={message.id}
                className={cn(
                  "flex animate-in fade-in-0 slide-in-from-bottom-2 duration-300 gap-3",
                  isCandidate && "flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    isCandidate ? "bg-slate-100 text-slate-600" : "bg-primary/10 text-primary",
                  )}
                >
                  {isCandidate ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
                    isCandidate
                      ? "rounded-tr-md bg-primary text-primary-foreground"
                      : "rounded-tl-md border bg-card text-foreground",
                  )}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {(isTyping || isSubmitting || isUploadingCv) && (
            <div className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-md border bg-card px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Typing...
                </span>
              </div>
            </div>
          )}
        </div>

        <footer className="border-t px-4 py-4 md:px-6">
          {step === "upload_cv" ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
                <label className="flex cursor-pointer items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  {uploadedFileName || "Select CV (PDF or DOCX, max 5MB)"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleCvUpload(file);
                    }}
                    disabled={isUploadingCv}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload is required before screening questions begin.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleCandidateText(input);
                  }
                }}
                placeholder={step === "screening" ? "Type your answer..." : "Type your response..."}
                disabled={isTyping || isSubmitting || isUploadingCv}
              />
              <Button
                size="icon"
                onClick={() => void handleCandidateText(input)}
                disabled={!input.trim() || isTyping || isSubmitting || isUploadingCv}
              >
                {isTyping || isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
