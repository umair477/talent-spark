import { useContext } from "react";
import { EmployeeAuthContext } from "@/contexts/employee-auth-context";

export function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext);
  if (!context) {
    throw new Error("useEmployeeAuth must be used within an EmployeeAuthProvider.");
  }
  return context;
}
