import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  employeeLogin,
  employeeLogout,
  employeeSignup,
  fetchEmployeeSession,
} from "@/lib/api";
import { EmployeeAuthContext } from "@/contexts/employee-auth-context";
import {
  setEmployeeSessionActive,
  shouldAttemptEmployeeSessionBootstrap,
} from "@/lib/employee-session";
import type { EmployeeAuthProfile } from "@/lib/api";
import type { EmployeeAuthContextValue } from "@/contexts/employee-auth-context";

function decodeJwtExpiry(token: string): number | null {
  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) {
      return null;
    }
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(padded)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<EmployeeAuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutTimerRef = useRef<number | null>(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current !== null) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const applyEmployeeSession = useCallback((profile: EmployeeAuthProfile | null) => {
    setEmployee(profile);
    setEmployeeSessionActive(profile !== null);
  }, []);

  const handleLogout = useCallback(async () => {
    clearLogoutTimer();
    try {
      await employeeLogout();
    } catch {
      // Clear local auth state even if the backend session is already gone.
    } finally {
      applyEmployeeSession(null);
    }
  }, [applyEmployeeSession, clearLogoutTimer]);

  const scheduleAutoLogout = useCallback((token: string) => {
    clearLogoutTimer();
    const expiresAt = decodeJwtExpiry(token);
    if (!expiresAt) {
      return;
    }
    const timeout = expiresAt - Date.now();
    if (timeout <= 0) {
      applyEmployeeSession(null);
      return;
    }
    logoutTimerRef.current = window.setTimeout(() => {
      void handleLogout();
    }, timeout);
  }, [clearLogoutTimer, handleLogout, applyEmployeeSession]);

  const refreshSession = useCallback(async () => {
    try {
      const profile = await fetchEmployeeSession();
      applyEmployeeSession(profile);
    } catch {
      applyEmployeeSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyEmployeeSession]);

  useEffect(() => {
    if (!shouldAttemptEmployeeSessionBootstrap()) {
      setIsLoading(false);
      return () => clearLogoutTimer();
    }
    void refreshSession();
    return () => clearLogoutTimer();
  }, [clearLogoutTimer, refreshSession]);

  const handleLogin = useCallback(async (payload: { email: string; password: string }) => {
    const response = await employeeLogin(payload);
    applyEmployeeSession(response.employee);
    scheduleAutoLogout(response.access_token);
    return response.employee;
  }, [applyEmployeeSession, scheduleAutoLogout]);

  const handleSignup = useCallback(async (payload: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
  }) => {
    const response = await employeeSignup(payload);
    return response.message;
  }, []);

  const value = useMemo<EmployeeAuthContextValue>(
    () => ({
      employee,
      isAuthenticated: employee !== null,
      isLoading,
      login: handleLogin,
      signup: handleSignup,
      logout: handleLogout,
      refreshSession,
    }),
    [employee, handleLogin, handleLogout, handleSignup, isLoading, refreshSession],
  );

  return <EmployeeAuthContext.Provider value={value}>{children}</EmployeeAuthContext.Provider>;
}
