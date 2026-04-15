import { API_BASE_URL } from "@/lib/config";

export type DemoRole = "ADMIN" | "EMPLOYEE" | "CANDIDATE";
export type UnifiedRole = "admin" | "employee" | "candidate";

const ACTIVE_ROLE_KEY = "talent-spark-active-role";
const SESSION_DISABLED_KEY = "talent-spark-session-disabled";
const SESSION_EVENT = "talent-spark-session-changed";

function getStorageKey(role: DemoRole) {
  return `talent-spark-token-${role.toLowerCase()}`;
}

function decodeBase64UrlSegment(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return window.atob(padded);
}

function emitSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function normalizeRole(value: unknown): DemoRole | null {
  if (value === "ADMIN" || value === "admin") {
    return "ADMIN";
  }
  if (value === "EMPLOYEE" || value === "employee") {
    return "EMPLOYEE";
  }
  if (value === "CANDIDATE" || value === "candidate") {
    return "CANDIDATE";
  }
  return null;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) {
      return null;
    }
    return JSON.parse(decodeBase64UrlSegment(payloadSegment)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  if (!exp) {
    return true;
  }
  return exp * 1000 <= Date.now();
}

function readRoleFromToken(token: string): DemoRole | null {
  const payload = parseJwtPayload(token);
  return normalizeRole(payload?.role);
}

export function dashboardPathForRole(role: DemoRole | UnifiedRole): string {
  const normalized = normalizeRole(role);
  if (normalized === "ADMIN") {
    return "/admin/dashboard";
  }
  if (normalized === "EMPLOYEE") {
    return "/employee/chat";
  }
  return "/jobs";
}

export function getActiveDemoRole(): DemoRole | null {
  const role = window.localStorage.getItem(ACTIVE_ROLE_KEY);
  if (role === "ADMIN" || role === "EMPLOYEE" || role === "CANDIDATE") {
    return role;
  }
  return null;
}

export function setActiveDemoRole(role: DemoRole): void {
  window.localStorage.setItem(ACTIVE_ROLE_KEY, role);
  window.localStorage.removeItem(SESSION_DISABLED_KEY);
  emitSessionChange();
}

export function getStoredDemoToken(role?: DemoRole): string | null {
  const resolvedRole = role ?? getActiveDemoRole();
  if (!resolvedRole) {
    return null;
  }
  return window.localStorage.getItem(getStorageKey(resolvedRole));
}

export function getDecodedSessionRole(role?: DemoRole): DemoRole | null {
  const token = getStoredDemoToken(role);
  if (!token) {
    return null;
  }
  return readRoleFromToken(token);
}

export function getDecodedSessionFullName(role?: DemoRole): string | null {
  const token = getStoredDemoToken(role);
  if (!token) {
    return null;
  }
  const payload = parseJwtPayload(token);
  const fullName = payload?.full_name;
  return typeof fullName === "string" && fullName.trim() ? fullName : null;
}

export function clearDemoTokens(): void {
  window.localStorage.removeItem(getStorageKey("ADMIN"));
  window.localStorage.removeItem(getStorageKey("EMPLOYEE"));
  window.localStorage.removeItem(getStorageKey("CANDIDATE"));
  emitSessionChange();
}

export function isDemoSessionSignedOut(): boolean {
  return window.localStorage.getItem(SESSION_DISABLED_KEY) === "true";
}

export function signOutDemoSession(): void {
  clearDemoTokens();
  window.localStorage.removeItem(ACTIVE_ROLE_KEY);
  window.localStorage.setItem(SESSION_DISABLED_KEY, "true");
  emitSessionChange();
}

export function resumeDemoSession(role: DemoRole = "ADMIN"): void {
  window.localStorage.removeItem(SESSION_DISABLED_KEY);
  window.localStorage.setItem(ACTIVE_ROLE_KEY, role);
  emitSessionChange();
}

export function subscribeToSessionChanges(callback: () => void): () => void {
  const wrapped = () => callback();
  window.addEventListener(SESSION_EVENT, wrapped);
  window.addEventListener("storage", wrapped);
  return () => {
    window.removeEventListener(SESSION_EVENT, wrapped);
    window.removeEventListener("storage", wrapped);
  };
}

async function isTokenStillValid(token: string): Promise<boolean> {
  if (isTokenExpired(token)) {
    return false;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.ok;
}

function resolveRequestedRole(role?: DemoRole): DemoRole {
  const resolvedRole = role ?? getActiveDemoRole();
  if (!resolvedRole) {
    throw new Error("No active session selected.");
  }
  return resolvedRole;
}

export async function ensureDemoToken(role?: DemoRole): Promise<string> {
  if (isDemoSessionSignedOut()) {
    throw new Error("Session is signed out.");
  }

  const resolvedRole = resolveRequestedRole(role);
  const storageKey = getStorageKey(resolvedRole);
  const cached = window.localStorage.getItem(storageKey);
  if (!cached) {
    throw new Error("Session token is missing. Please sign in again.");
  }

  try {
    if (await isTokenStillValid(cached)) {
      return cached;
    }
  } catch {
    // Fall through to clear stale session state.
  }

  window.localStorage.removeItem(storageKey);
  if (getActiveDemoRole() === resolvedRole) {
    window.localStorage.removeItem(ACTIVE_ROLE_KEY);
  }
  emitSessionChange();
  throw new Error("Session expired. Please sign in again.");
}

export function persistSessionFromLogin(token: string): DemoRole {
  const role = readRoleFromToken(token);
  if (!role) {
    throw new Error("Access denied. Please contact your administrator.");
  }

  window.localStorage.setItem(getStorageKey(role), token);
  window.localStorage.setItem(ACTIVE_ROLE_KEY, role);
  window.localStorage.removeItem(SESSION_DISABLED_KEY);
  emitSessionChange();
  return role;
}

export function clearExpiredStoredTokens(): void {
  const roles: DemoRole[] = ["ADMIN", "EMPLOYEE", "CANDIDATE"];
  for (const role of roles) {
    const key = getStorageKey(role);
    const token = window.localStorage.getItem(key);
    if (!token) {
      continue;
    }
    if (isTokenExpired(token)) {
      window.localStorage.removeItem(key);
    }
  }

  const active = getActiveDemoRole();
  if (active && !window.localStorage.getItem(getStorageKey(active))) {
    window.localStorage.removeItem(ACTIVE_ROLE_KEY);
  }
}
