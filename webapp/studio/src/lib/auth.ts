const AUTH_TOKEN_KEY = "cs.auth.token";

export type AuthUser = {
  id: string;
  email: string;
};

type SignInResponse = {
  success: boolean;
  data?: {
    token: string;
    user: AuthUser;
  };
  error?: string;
};

type SessionResponse = {
  authenticated: boolean;
  user?: AuthUser;
};

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function buildAuthHeaders(headers: Record<string, string> = {}) {
  const token = getAuthToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch("/api/auth/sign_in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await readJson<SignInResponse>(response);

  if (!response.ok || !payload.success || !payload.data?.token) {
    throw new Error(payload.error || "Invalid email or password");
  }

  setAuthToken(payload.data.token);

  return payload.data.user;
}

export async function loadCurrentUser() {
  const response = await fetch("/api/auth/me", {
    headers: buildAuthHeaders(),
  });

  const payload = await readJson<SessionResponse>(response);

  if (!response.ok || !payload.authenticated || !payload.user) {
    clearAuthToken();
    return null;
  }

  return payload.user;
}

export async function signOut() {
  const response = await fetch("/api/auth/sign_out", {
    method: "POST",
    headers: buildAuthHeaders(),
  });

  await readJson(response);
  clearAuthToken();
}

async function readJson<T = unknown>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();

  if (!body) {
    return {} as T;
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Expected JSON API response but received HTML/text.");
  }

  return JSON.parse(body) as T;
}
