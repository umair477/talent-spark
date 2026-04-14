import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import ChatPage from "@/pages/ChatPage";
import CandidateRecruitmentPage from "@/pages/CandidateRecruitmentPage";
import LeavePage from "@/pages/LeavePage";
import LeaveHistoryPage from "@/pages/LeaveHistoryPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import SignedOutPage from "@/pages/SignedOutPage";
import JobsLandingPage from "@/pages/JobsLandingPage";
import UserManagementPage from "@/pages/UserManagementPage";
import AdminJobsPage from "@/pages/AdminJobsPage";
import AdminCandidatesPage from "@/pages/AdminCandidatesPage";
import EmployeeSignupPage from "@/pages/EmployeeSignupPage";
import EmployeeLoginPage from "@/pages/EmployeeLoginPage";
import EmployeeDashboardPage from "@/pages/EmployeeDashboardPage";
import NotFound from "@/pages/NotFound";
import { EmployeeAuthProvider } from "@/contexts/EmployeeAuthContext";
import { useEmployeeAuth } from "@/hooks/use-employee-auth";
import { getActiveDemoRole, getDecodedSessionRole, isDemoSessionSignedOut, subscribeToSessionChanges } from "@/lib/auth";
import { useSessionProfile } from "@/hooks/use-session-profile";

const queryClient = new QueryClient();

const HOME_BY_ROLE = {
  ADMIN: "/admin/jobs",
  EMPLOYEE: "/employee/dashboard",
  CANDIDATE: "/jobs",
} as const;

function FullPageMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <div className="rounded-3xl border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm">{message}</div>
    </div>
  );
}

function SessionGate() {
  const location = useLocation();
  const employeeAuth = useEmployeeAuth();
  const [signedOut, setSignedOut] = useState(isDemoSessionSignedOut());
  const [activeRole, setActiveRole] = useState(getActiveDemoRole());
  const isEmployeeAuthPage =
    location.pathname === "/employee/login" || location.pathname === "/employee/signup";

  useEffect(() => {
    return subscribeToSessionChanges(() => {
      setSignedOut(isDemoSessionSignedOut());
      setActiveRole(getActiveDemoRole());
    });
  }, []);

  if (employeeAuth.isAuthenticated && isEmployeeAuthPage) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  if (employeeAuth.isAuthenticated && location.pathname === "/signed-out") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  if (isEmployeeAuthPage) {
    return <Outlet />;
  }

  if (!employeeAuth.isAuthenticated && !employeeAuth.isLoading && (signedOut || activeRole === null) && location.pathname !== "/signed-out") {
    return <Navigate to="/signed-out" replace />;
  }

  if (!employeeAuth.isAuthenticated && !signedOut && activeRole !== null && location.pathname === "/signed-out") {
    return <Navigate to={HOME_BY_ROLE[activeRole]} replace />;
  }

  return <Outlet />;
}

function ProtectedRoute({
  allowedRoles,
}: {
  allowedRoles: Array<"ADMIN" | "EMPLOYEE" | "CANDIDATE">;
}) {
  const employeeAuth = useEmployeeAuth();
  const { data, isLoading, isError } = useSessionProfile();

  if (employeeAuth.isLoading && !employeeAuth.isAuthenticated) {
    return <FullPageMessage message="Loading your secure workspace..." />;
  }

  if (employeeAuth.isAuthenticated && employeeAuth.employee) {
    if (!allowedRoles.includes("EMPLOYEE")) {
      return <Navigate to="/employee/dashboard" replace />;
    }
    return <Outlet />;
  }

  if (isLoading) {
    return <FullPageMessage message="Loading your secure workspace..." />;
  }

  if (isError || !data) {
    return <Navigate to="/signed-out" replace />;
  }

  const decodedRole = getDecodedSessionRole() ?? data.role;
  if (!allowedRoles.includes(decodedRole)) {
    return <Navigate to={HOME_BY_ROLE[decodedRole]} replace />;
  }

  return <Outlet />;
}

function AppShell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function RoleHomeRedirect() {
  const employeeAuth = useEmployeeAuth();
  const { data, isLoading } = useSessionProfile();
  if (employeeAuth.isAuthenticated) {
    return <Navigate to="/employee/dashboard" replace />;
  }
  if (isLoading || !data) {
    return <FullPageMessage message="Preparing your home screen..." />;
  }
  return <Navigate to={HOME_BY_ROLE[data.role]} replace />;
}

function LeaveRoutePage() {
  const { data, isLoading } = useSessionProfile();
  if (isLoading || !data) {
    return <FullPageMessage message="Loading leave workspace..." />;
  }
  return data.role === "EMPLOYEE" ? <LeaveHistoryPage /> : <Navigate to="/admin/leaves" replace />;
}

function RecruitmentRoutePage() {
  const { data, isLoading } = useSessionProfile();
  if (isLoading || !data) {
    return <FullPageMessage message="Loading recruitment workspace..." />;
  }
  return data.role === "CANDIDATE" ? <CandidateRecruitmentPage /> : <Navigate to="/admin/candidates" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <EmployeeAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/employee/signup" element={<EmployeeSignupPage />} />
            <Route path="/employee/login" element={<EmployeeLoginPage />} />
            <Route element={<SessionGate />}>
              <Route path="/signed-out" element={<SignedOutPage />} />
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE", "CANDIDATE"]} />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<RoleHomeRedirect />} />
                  <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  <Route element={<ProtectedRoute allowedRoles={["CANDIDATE"]} />}>
                    <Route path="/jobs" element={<JobsLandingPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE"]} />}>
                    <Route path="/chatbot" element={<ChatPage />} />
                    <Route path="/leave" element={<LeaveRoutePage />} />
                    <Route path="/leave/history" element={<LeaveHistoryPage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={["ADMIN", "CANDIDATE"]} />}>
                    <Route path="/recruitment" element={<RecruitmentRoutePage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                    <Route path="/admin/jobs" element={<AdminJobsPage />} />
                    <Route path="/admin/candidates" element={<AdminCandidatesPage />} />
                    <Route path="/admin/leaves" element={<LeavePage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/users" element={<UserManagementPage />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </EmployeeAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
