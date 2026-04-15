import { API_BASE_URL } from "@/lib/config";
import { DemoRole, ensureDemoToken } from "@/lib/auth";
import { isEmployeeSessionActive } from "@/lib/employee-session";

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  leave_type: "Annual" | "Sick" | "Casual" | "Unpaid";
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  hr_note: string;
  handover_contact: string;
  handover_notes: string;
  urgency_level: string;
  privacy_flagged: boolean;
  submitted_at: string;
  created_at: string;
}

export interface AdminLeave {
  leave_id: number;
  employee_id: number;
  employee_name: string;
  leave_type: "Annual" | "Sick" | "Casual" | "Unpaid";
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  hr_note: string;
  email_sent_at?: string | null;
  submitted_at: string;
}

export interface LeaveBalance {
  employee_id: number;
  total: number;
  used: number;
  remaining: number;
  provider: string;
}

export interface LeaveQuota {
  employee_id: number;
  employee_name: string;
  year: number;
  annual_total: number;
  annual_used: number;
  annual_remaining: number;
  sick_total: number;
  sick_used: number;
  sick_remaining: number;
  casual_total: number;
  casual_used: number;
  casual_remaining: number;
  unpaid_used: number;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "EMPLOYEE" | "CANDIDATE";
  employee_id: number | null;
  candidate_id: number | null;
}

export interface UnifiedLoginResponse {
  access_token: string;
  token_type: string;
  role: "admin" | "employee" | "candidate";
  full_name: string;
  employee_id: number | null;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "EMPLOYEE" | "CANDIDATE";
  employee_id: number | null;
  candidate_id: number | null;
}

export interface EmployeeAuthProfile {
  employee_id: number;
  full_name: string;
  email: string;
  department: string;
  designation: string;
  date_of_joining: string;
  role: "EMPLOYEE" | "ADMIN";
  is_active: boolean;
}

export interface EmployeeAuthResponse {
  access_token: string;
  token_type: string;
  employee: EmployeeAuthProfile;
}

export interface LeaveChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface LeaveChatResponse {
  reply: string;
  conversation_history: LeaveChatHistoryItem[];
}

export interface EmployeeLeaveRecord {
  leave_id: number;
  leave_type: "Annual" | "Sick" | "Casual" | "Unpaid";
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  hr_note: string;
  submitted_at: string;
}

export interface EmployeeLeaveQuota {
  annual_total: number;
  annual_remaining: number;
  sick_total: number;
  sick_remaining: number;
  casual_total: number;
  casual_remaining: number;
  unpaid_used: number;
}

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  job_id: number | null;
  role_title: string;
  cv_summary: string;
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

export interface AdminCandidate {
  candidate_id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_id: number | null;
  job_position: string;
  cv_summary: string;
  screening_score: number;
  recommendation_label: "Highly Recommended" | "Recommended" | "Needs Review" | "Not Recommended";
  interview_email_sent: boolean;
  interview_date: string | null;
  interview_email_sent_at: string | null;
  interview_transcript: Array<{
    question: string;
    answer: string;
    score: number;
    justification: string;
    source: string;
  }>;
  score_breakdown: Array<{
    question: string;
    answer: string;
    score: number;
    justification: string;
    source: string;
  }>;
  applied_at: string;
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

export interface AdminJob {
  job_id: number;
  title: string;
  description: string;
  required_skills: string[];
  experience_years: number;
  employment_type: "Full-time" | "Part-time" | "Contract";
  salary_range: string | null;
  responsibilities: string[];
  nice_to_have_qualifications: string[];
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface AdminEmployee {
  employee_id: number;
  full_name: string;
  official_email: string;
  department: string;
  designation: string;
  date_of_joining: string;
  role: "admin" | "employee";
  is_active: boolean;
  password_set: boolean;
  annual_total: number;
  annual_used: number;
  annual_remaining: number;
  sick_total: number;
  sick_used: number;
  sick_remaining: number;
  casual_total: number;
  casual_used: number;
  casual_remaining: number;
  unpaid_used: number;
}

export interface PublicJob {
  job_id: number;
  title: string;
  description: string;
  required_skills: string[];
  experience_years: number;
  employment_type: "Full-time" | "Part-time" | "Contract";
  salary_range: string | null;
  responsibilities: string[];
  nice_to_have_qualifications: string[];
  status: "open" | "closed";
  created_at: string;
}

export interface PublicJobListing {
  job_id: number;
  title: string;
  employment_type: "Full-time" | "Part-time" | "Contract";
  experience_years: number;
  description: string;
  responsibilities: string[];
}

export interface CandidateCVUploadResponse {
  candidate_id: number;
  full_name: string;
  email: string;
  total_years_experience: number;
  top_skills: string[];
  extracted_summary: Record<string, unknown>;
  reply: string;
}

export interface CandidatePublicApplyResponse {
  session_id: string;
  candidate_id: number;
  reply: string;
  question_number: number;
  total_questions: number;
}

export interface CandidatePublicChatResponse {
  reply: string;
  question_number: number;
  total_questions: number;
  requires_elaboration: boolean;
  ready_for_submission: boolean;
}

export interface CandidatePublicSubmitResponse {
  reply: string;
  submitted: boolean;
}

async function parseError(response: Response): Promise<Error> {
  let detail = `Request failed with status ${response.status}`;
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload?.detail) {
      detail = payload.detail;
    }
  } catch {
    // Ignore JSON parsing failures for non-JSON responses.
  }
  return new Error(detail);
}

async function authorizedFetch(path: string, init?: RequestInit, role?: DemoRole) {
  if (!role && isEmployeeSessionActive()) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
    });
    if (!response.ok) {
      throw await parseError(response);
    }
    return response;
  }

  const token = await ensureDemoToken(role);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response;
}

export async function fetchCurrentUserProfile(role?: DemoRole): Promise<UserProfile> {
  if (!role && isEmployeeSessionActive()) {
    const response = await fetch(`${API_BASE_URL}/api/auth/employee/me`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw await parseError(response);
    }
    const employee = (await response.json()) as EmployeeAuthProfile;
    return {
      id: employee.employee_id,
      email: employee.email,
      full_name: employee.full_name,
      role: "EMPLOYEE",
      employee_id: employee.employee_id,
      candidate_id: null,
    };
  }
  const response = await authorizedFetch("/api/auth/me", undefined, role);
  return response.json();
}

export async function employeeSignup(payload: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/employee/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function unifiedLogin(payload: { email: string; password: string }): Promise<UnifiedLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function employeeLogin(payload: { email: string; password: string }): Promise<EmployeeAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/employee/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function fetchEmployeeSession(): Promise<EmployeeAuthProfile> {
  const response = await fetch(`${API_BASE_URL}/api/auth/employee/me`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function employeeLogout(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/employee/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function sendEmployeeLeaveChat(payload: {
  message: string;
  conversation_history: LeaveChatHistoryItem[];
}): Promise<LeaveChatResponse> {
  const response = await authorizedFetch("/api/chat/leave", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function submitEmployeeLeave(payload: {
  leave_type: "Annual" | "Sick" | "Casual" | "Unpaid";
  start_date: string;
  end_date: string;
  reason: string;
}): Promise<EmployeeLeaveRecord> {
  const response = await authorizedFetch("/api/leaves", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function fetchEmployeeLeaves(): Promise<EmployeeLeaveRecord[]> {
  const response = await authorizedFetch("/api/leaves/my");
  return response.json();
}

export async function fetchEmployeeLeaveQuota(): Promise<EmployeeLeaveQuota> {
  const response = await authorizedFetch("/api/leaves/quota/my");
  return response.json();
}

export async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  const response = await authorizedFetch("/api/admin/all-leaves", undefined, "ADMIN");
  return response.json();
}

export async function fetchAdminLeaves(): Promise<AdminLeave[]> {
  const response = await authorizedFetch("/api/admin/leaves", undefined, "ADMIN");
  return response.json();
}

export async function fetchLeaveQuotas(): Promise<LeaveQuota[]> {
  const response = await authorizedFetch("/api/admin/employees/leave-quota", undefined, "ADMIN");
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
  status: "approved" | "rejected",
  hrNote = "",
): Promise<LeaveRequest> {
  const response = await authorizedFetch(
    `/api/leave/requests/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, hr_note: hrNote }),
    },
    "ADMIN",
  );
  return response.json();
}

export async function updateAdminLeave(
  leaveId: number,
  payload: { status: "approved" | "rejected"; hr_note?: string },
): Promise<AdminLeave> {
  const response = await authorizedFetch(
    `/api/admin/leaves/${leaveId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "ADMIN",
  );
  return response.json();
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const response = await authorizedFetch("/api/recruitment/candidates", undefined, "ADMIN");
  return response.json();
}

export async function fetchAdminCandidates(jobId?: number): Promise<AdminCandidate[]> {
  const path = jobId ? `/api/admin/candidates?job_id=${jobId}` : "/api/admin/candidates";
  const response = await authorizedFetch(path, undefined, "ADMIN");
  return response.json();
}

export async function fetchAdminCandidate(candidateId: number): Promise<AdminCandidate> {
  const response = await authorizedFetch(`/api/admin/candidates/${candidateId}`, undefined, "ADMIN");
  return response.json();
}

export async function generateInterviewEmailDraft(
  candidateId: number,
  payload: {
    interview_date: string;
    interview_time: string;
    interview_format: string;
    location_or_link: string;
    additional_notes?: string;
  },
): Promise<{ to_email: string; subject: string; body: string }> {
  const response = await authorizedFetch(
    `/api/admin/candidates/${candidateId}/generate-interview-email`,
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

export async function sendInterviewEmail(
  candidateId: number,
  payload: {
    to_email: string;
    subject: string;
    body: string;
    interview_date?: string;
  },
): Promise<{ message: string }> {
  const response = await authorizedFetch(
    `/api/admin/candidates/${candidateId}/send-interview-email`,
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

export async function fetchCandidateApplicationStatus(): Promise<CandidateApplicationStatus> {
  const response = await authorizedFetch("/api/recruitment/status");
  return response.json();
}

export async function fetchPublicJobs(): Promise<PublicJob[]> {
  const response = await fetch(`${API_BASE_URL}/api/recruitment/jobs`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchPublicJobListings(): Promise<PublicJobListing[]> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/public`);
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function uploadCandidateCv(payload: {
  first_name: string;
  last_name: string;
  email: string;
  file: File;
}): Promise<CandidateCVUploadResponse> {
  const formData = new FormData();
  formData.append("first_name", payload.first_name);
  formData.append("last_name", payload.last_name);
  formData.append("email", payload.email);
  formData.append("file", payload.file);

  const response = await fetch(`${API_BASE_URL}/api/candidates/upload-cv`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function startCandidateApplication(
  jobId: number,
  payload: { first_name: string; last_name: string; email: string },
): Promise<CandidatePublicApplyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/candidates/apply/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function chatCandidateApplication(payload: {
  session_id: string;
  message: string;
}): Promise<CandidatePublicChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/candidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function submitCandidateApplication(sessionId: string): Promise<CandidatePublicSubmitResponse> {
  const response = await fetch(`${API_BASE_URL}/api/candidates/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function applyForJob(payload: { job_id?: number; role_title?: string; job_description?: string }): Promise<CandidateApplicationStatus> {
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

export async function fetchAdminEmployees(): Promise<AdminEmployee[]> {
  const response = await authorizedFetch("/api/admin/employees", undefined, "ADMIN");
  return response.json();
}

export async function createAdminEmployee(payload: {
  full_name: string;
  official_email: string;
  department: string;
  designation: string;
  date_of_joining: string;
  role: "employee" | "admin";
}): Promise<{ message: string; employee_id: number }> {
  const response = await authorizedFetch(
    "/api/admin/employees",
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

export async function updateAdminEmployee(
  employeeId: number,
  payload: {
    department?: string;
    designation?: string;
    role?: "employee" | "admin";
    is_active?: boolean;
  },
): Promise<AdminEmployee> {
  const response = await authorizedFetch(
    `/api/admin/employees/${employeeId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "ADMIN",
  );
  return response.json();
}

export async function deactivateAdminEmployee(employeeId: number): Promise<{ message: string }> {
  const response = await authorizedFetch(
    `/api/admin/employees/${employeeId}`,
    {
      method: "DELETE",
    },
    "ADMIN",
  );
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

export async function fetchAdminJobs(): Promise<AdminJob[]> {
  const response = await authorizedFetch("/api/admin/jobs", undefined, "ADMIN");
  return response.json();
}

export async function createAdminJob(payload: { title: string }): Promise<AdminJob> {
  const response = await authorizedFetch(
    "/api/admin/jobs",
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

export async function updateAdminJob(
  jobId: number,
  payload: Partial<Pick<AdminJob, "title" | "description" | "required_skills" | "experience_years" | "employment_type" | "salary_range" | "responsibilities" | "nice_to_have_qualifications" | "status">>,
): Promise<AdminJob> {
  const response = await authorizedFetch(
    `/api/admin/jobs/${jobId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "ADMIN",
  );
  return response.json();
}

export async function deleteAdminJob(jobId: number): Promise<void> {
  await authorizedFetch(
    `/api/admin/jobs/${jobId}`,
    {
      method: "DELETE",
    },
    "ADMIN",
  );
}
