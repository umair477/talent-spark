import { createContext } from "react";
import type { EmployeeAuthProfile } from "@/lib/api";

export type EmployeeAuthContextValue = {
  employee: EmployeeAuthProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<EmployeeAuthProfile>;
  signup: (payload: { full_name: string; email: string; password: string; confirm_password: string }) => Promise<string>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export const EmployeeAuthContext = createContext<EmployeeAuthContextValue | undefined>(undefined);
