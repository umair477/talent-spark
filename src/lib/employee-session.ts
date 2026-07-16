let employeeSessionActive = false;
const EMPLOYEE_SESSION_TOKEN_KEY = "talent-spark-employee-session-token";

export function isEmployeeSessionActive() {
  return employeeSessionActive;
}

export function setEmployeeSessionActive(active: boolean) {
  employeeSessionActive = active;
}

export function getEmployeeSessionToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(EMPLOYEE_SESSION_TOKEN_KEY);
}

export function setEmployeeSessionToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(EMPLOYEE_SESSION_TOKEN_KEY, token);
}

export function clearEmployeeSessionToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(EMPLOYEE_SESSION_TOKEN_KEY);
}

export function shouldAttemptEmployeeSessionBootstrap(pathname?: string) {
  const resolvedPathname =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");

  // Only probe the cookie-backed employee session on protected employee pages.
  if (!resolvedPathname.startsWith("/employee/")) {
    return false;
  }
  if (resolvedPathname === "/employee/login" || resolvedPathname === "/employee/signup") {
    return false;
  }
  return true;
}
