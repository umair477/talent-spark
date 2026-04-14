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

function decodeBase64UrlSegment(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return window.atob(padded);
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

  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) {
      return null;
    }
    const payload = JSON.parse(decodeBase64UrlSegment(payloadSegment)) as { role?: DemoRole };
    if (payload.role === "ADMIN" || payload.role === "EMPLOYEE" || payload.role === "CANDIDATE") {
      return payload.role;
    }
  } catch {
    return null;
  }

  return null;
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
