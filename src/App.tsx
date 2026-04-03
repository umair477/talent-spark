import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import ChatPage from "@/pages/ChatPage";
import RecruitmentPage from "@/pages/RecruitmentPage";
import CandidateRecruitmentPage from "@/pages/CandidateRecruitmentPage";
import LeavePage from "@/pages/LeavePage";
import LeaveHistoryPage from "@/pages/LeaveHistoryPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import SignedOutPage from "@/pages/SignedOutPage";
import JobsLandingPage from "@/pages/JobsLandingPage";
import UserManagementPage from "@/pages/UserManagementPage";
import NotFound from "@/pages/NotFound";
import { getActiveDemoRole, isDemoSessionSignedOut, subscribeToSessionChanges } from "@/lib/auth";
import { useSessionProfile } from "@/hooks/use-session-profile";

const queryClient = new QueryClient();

const HOME_BY_ROLE = {
  ADMIN: "/recruitment",
  EMPLOYEE: "/chatbot",
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
  const [signedOut, setSignedOut] = useState(isDemoSessionSignedOut());
  const [activeRole, setActiveRole] = useState(getActiveDemoRole());

  useEffect(() => {
    return subscribeToSessionChanges(() => {
      setSignedOut(isDemoSessionSignedOut());
      setActiveRole(getActiveDemoRole());
    });
  }, []);

  if ((signedOut || activeRole === null) && location.pathname !== "/signed-out") {
    return <Navigate to="/signed-out" replace />;
  }

  if (!signedOut && activeRole !== null && location.pathname === "/signed-out") {
    return <Navigate to={HOME_BY_ROLE[activeRole]} replace />;
  }

  return <Outlet />;
}

function ProtectedRoute({
  allowedRoles,
}: {
  allowedRoles: Array<"ADMIN" | "EMPLOYEE" | "CANDIDATE">;
}) {
  const { data, isLoading, isError } = useSessionProfile();

  if (isLoading) {
    return <FullPageMessage message="Loading your secure workspace..." />;
  }

  if (isError || !data) {
    return <Navigate to="/signed-out" replace />;
  }

  if (!allowedRoles.includes(data.role)) {
    return <Navigate to={HOME_BY_ROLE[data.role]} replace />;
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
  const { data, isLoading } = useSessionProfile();
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
  return data.role === "EMPLOYEE" ? <LeaveHistoryPage /> : <LeavePage />;
}

function RecruitmentRoutePage() {
  const { data, isLoading } = useSessionProfile();
  if (isLoading || !data) {
    return <FullPageMessage message="Loading recruitment workspace..." />;
  }
  return data.role === "CANDIDATE" ? <CandidateRecruitmentPage /> : <RecruitmentPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<SessionGate />}>
            <Route path="/signed-out" element={<SignedOutPage />} />
            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE", "CANDIDATE"]} />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<RoleHomeRedirect />} />
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
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/users" element={<UserManagementPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
