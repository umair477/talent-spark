import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUserProfile } from "@/lib/api";
import { getActiveDemoRole, isDemoSessionSignedOut } from "@/lib/auth";

export function useSessionProfile() {
  const activeRole = getActiveDemoRole();

  return useQuery({
    queryKey: ["session-profile", activeRole],
    queryFn: () => fetchCurrentUserProfile(),
    enabled: !isDemoSessionSignedOut() && activeRole !== null,
    retry: false,
  });
}
