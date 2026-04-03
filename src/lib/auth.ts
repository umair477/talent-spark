import { API_BASE_URL } from "@/lib/config";

export type DemoRole = "ADMIN" | "EMPLOYEE" | "CANDIDATE";

const DEMO_CREDENTIALS: Record<DemoRole, { email: string; password: string }> = {
  ADMIN: {
    email: "admin.hr@talentspark.dev",
    password: "admin123",
  },
  EMPLOYEE: {
    email: "employee@talentspark.dev",
    password: "user123",
  },
  CANDIDATE: {
    email: "candidate@talentspark.dev",
    password: "user123",
  },
};

const ACTIVE_ROLE_KEY = "talent-spark-active-role";
const SESSION_DISABLED_KEY = "talent-spark-session-disabled";
const SESSION_EVENT = "talent-spark-session-changed";

function getStorageKey(role: DemoRole) {
  return `talent-spark-token-${role.toLowerCase()}`;
}

function emitSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
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
    throw new Error("No active demo session selected.");
  }
  return resolvedRole;
}

export async function ensureDemoToken(role?: DemoRole): Promise<string> {
  if (isDemoSessionSignedOut()) {
    throw new Error("Demo session is signed out.");
  }

  const resolvedRole = resolveRequestedRole(role);
  const storageKey = getStorageKey(resolvedRole);
  const cached = window.localStorage.getItem(storageKey);
  if (cached) {
    try {
      if (await isTokenStillValid(cached)) {
        return cached;
      }
    } catch {
      // Fall through to re-authenticate if the cached token cannot be verified.
    }
    window.localStorage.removeItem(storageKey);
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(DEMO_CREDENTIALS[resolvedRole]),
  });

  if (!response.ok) {
    throw new Error(`Unable to authenticate demo ${resolvedRole.toLowerCase()} user.`);
  }

  const data = (await response.json()) as { access_token: string };
  window.localStorage.setItem(storageKey, data.access_token);
  if (getActiveDemoRole() !== resolvedRole) {
    setActiveDemoRole(resolvedRole);
  }
  return data.access_token;
}
