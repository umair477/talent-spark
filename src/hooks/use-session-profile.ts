import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUserProfile } from "@/lib/api";
import { getActiveDemoRole, isDemoSessionSignedOut } from "@/lib/auth";
import { useEmployeeAuth } from "@/hooks/use-employee-auth";

export function useSessionProfile() {
  const employeeAuth = useEmployeeAuth();
  const activeRole = getActiveDemoRole();
  const hasDemoSession = !isDemoSessionSignedOut() && activeRole !== null;

  const query = useQuery({
    queryKey: ["session-profile", activeRole],
    queryFn: () => fetchCurrentUserProfile(),
    enabled: !employeeAuth.isAuthenticated && !employeeAuth.isLoading && hasDemoSession,
    retry: false,
  });

  if (employeeAuth.isAuthenticated && employeeAuth.employee) {
    return {
      data: {
        id: employeeAuth.employee.employee_id,
        email: employeeAuth.employee.email,
        full_name: employeeAuth.employee.full_name,
        role: "EMPLOYEE" as const,
        employee_id: employeeAuth.employee.employee_id,
        candidate_id: null,
      },
      isLoading: false,
      isError: false,
    };
  }

  if (employeeAuth.isLoading && !hasDemoSession) {
    return {
      data: undefined,
      isLoading: true,
      isError: false,
    };
  }

  return query;
}
