import { API_BASE_URL } from "@/lib/config";
import { DemoRole, ensureDemoToken } from "@/lib/auth";

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  handover_contact: string;
  handover_notes: string;
  urgency_level: string;
  privacy_flagged: boolean;
  created_at: string;
}

export interface LeaveBalance {
  employee_id: number;
  total: number;
  used: number;
  remaining: number;
  provider: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "EMPLOYEE" | "CANDIDATE";
  employee_id: number | null;
  candidate_id: number | null;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "EMPLOYEE" | "CANDIDATE";
  employee_id: number | null;
  candidate_id: number | null;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  role_title: string;
  ai_score: number;
  resume_score: number;
  interview_score: number;
  status: "Shortlisted" | "Under Review" | "Rejected" | "Interview Scheduled";
  interview_status: "pending" | "in_progress" | "completed";
  summary: string;
  skills: string[];
  skim_insights: string[];
  screening_transcript: string[];
  screening_questions: string[];
  raw_answers: Array<{
    question: string;
    answer: string;
    score: number;
    justification: string;
    source: string;
  }>;
  current_question_index: number;
  job_description: string;
  created_at: string;
}

export interface CandidateApplicationStatus {
  candidate: Candidate | null;
}

export interface MetricCard {
  label: string;
  value: string;
  change: string;
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface AnalyticsOverview {
  stats: MetricCard[];
  monthly_hires: AnalyticsPoint[];
  candidates_by_department: AnalyticsPoint[];
}

export interface CandidateScoreResponse {
  candidate: Candidate;
  scorecard: Record<string, unknown>;
  resume_excerpt: string;
}

export interface CandidateInterviewResponse {
  candidate: Candidate;
  evaluation: {
    question: string;
    answer: string;
    score: number;
    justification: string;
    source: string;
  };
  next_question: string | null;
}

async function authorizedFetch(path: string, init?: RequestInit, role?: DemoRole) {
  const token = await ensureDemoToken(role);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response;
}

export async function fetchCurrentUserProfile(role?: DemoRole): Promise<UserProfile> {
  const response = await authorizedFetch("/api/auth/me", undefined, role);
  return response.json();
}

export async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  const response = await authorizedFetch("/api/admin/all-leaves", undefined, "ADMIN");
  return response.json();
}

export async function fetchMyLeaveBalance(): Promise<LeaveBalance> {
  const response = await authorizedFetch("/api/leave/balance");
  return response.json();
}

export async function fetchMyLeaveHistory(): Promise<LeaveRequest[]> {
  const response = await authorizedFetch("/api/leave/history");
  return response.json();
}

export async function updateLeaveRequestStatus(
  id: number,
  status: "approved" | "denied",
): Promise<LeaveRequest> {
  const response = await authorizedFetch(
    `/api/leave/requests/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
    "ADMIN",
  );
  return response.json();
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const response = await authorizedFetch("/api/recruitment/candidates", undefined, "ADMIN");
  return response.json();
}

export async function fetchCandidateApplicationStatus(): Promise<CandidateApplicationStatus> {
  const response = await authorizedFetch("/api/recruitment/status");
  return response.json();
}

export async function applyForJob(payload: { role_title: string; job_description: string }): Promise<CandidateApplicationStatus> {
  const response = await authorizedFetch("/api/recruitment/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function scoreResume(formData: FormData): Promise<CandidateScoreResponse> {
  const response = await authorizedFetch("/api/recruitment/score-resume", {
    method: "POST",
    body: formData,
  }, "ADMIN");
  return response.json();
}

export async function submitInterviewAnswer(
  candidateId: number,
  answer: string,
): Promise<CandidateInterviewResponse> {
  const response = await authorizedFetch(
    `/api/recruitment/candidates/${candidateId}/interview/answer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answer }),
    },
    "ADMIN",
  );
  return response.json();
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await authorizedFetch("/api/analytics/overview", undefined, "ADMIN");
  return response.json();
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await authorizedFetch("/api/admin/users", undefined, "ADMIN");
  return response.json();
}

export async function promoteCandidateToEmployee(
  userId: number,
  payload: { department: string; annual_allowance?: number },
): Promise<AdminUser> {
  const response = await authorizedFetch(
    `/api/admin/users/${userId}/promote`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "ADMIN",
  );
  return response.json();
}
