let employeeSessionActive = false;

export function isEmployeeSessionActive() {
  return employeeSessionActive;
}

export function setEmployeeSessionActive(active: boolean) {
  employeeSessionActive = active;
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
