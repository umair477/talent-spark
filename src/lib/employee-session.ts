const EMPLOYEE_SESSION_ACTIVE_KEY = "talent-spark-employee-session-active";

function readStoredEmployeeSessionActive(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(EMPLOYEE_SESSION_ACTIVE_KEY) === "true";
}

let employeeSessionActive = readStoredEmployeeSessionActive();

export function isEmployeeSessionActive() {
  return employeeSessionActive;
}

export function setEmployeeSessionActive(active: boolean) {
  employeeSessionActive = active;
  if (typeof window === "undefined") {
    return;
  }
  if (active) {
    window.localStorage.setItem(EMPLOYEE_SESSION_ACTIVE_KEY, "true");
    return;
  }
  window.localStorage.removeItem(EMPLOYEE_SESSION_ACTIVE_KEY);
}

export function shouldAttemptEmployeeSessionBootstrap(pathname?: string) {
  if (isEmployeeSessionActive()) {
    return true;
  }

  const resolvedPathname =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");

  return resolvedPathname.startsWith("/employee/");
}
