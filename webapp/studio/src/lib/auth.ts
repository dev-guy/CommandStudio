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
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await readJson<SignInResponse>(response, { allowNonJson: true });

  if (!payload) {
    throw new Error("Authentication service returned an unexpected response.");
  }

  if (!response.ok || !payload.success || !payload.data?.token) {
    throw new Error(payload.error || "Invalid email or password");
  }

  setAuthToken(payload.data.token);

  return payload.data.user;
}

export async function loadCurrentUser() {
  const response = await fetch("/api/auth/me", {
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  const payload = await readJson<SessionResponse>(response, { allowNonJson: true });

  if (!payload || !response.ok || !payload.authenticated || !payload.user) {
    clearAuthToken();
    return null;
  }

  return payload.user;
}

export async function signOut() {
  const response = await fetch("/api/auth/sign_out", {
    method: "POST",
    headers: buildAuthHeaders({ Accept: "application/json" }),
  });

  await readJson(response, { allowNonJson: true });
  clearAuthToken();
}

async function readJson<T = unknown>(
  response: Response,
  options: { allowNonJson?: boolean } = {},
): Promise<T | null> {
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();

  if (!body) {
    return {} as T;
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    if (options.allowNonJson) {
      return null;
    }

    throw new Error("Expected JSON API response but received HTML/text.");
  }

  return JSON.parse(body) as T;
}
