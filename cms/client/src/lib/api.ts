const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";
const TOKEN_KEY = "cms_token";

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode / blocked storage */
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { formData?: FormData } = {}
): Promise<T> {
  const { formData, headers, body, ...rest } = options;
  const token = getAuthToken();
  const mergedHeaders: HeadersInit = formData
    ? { ...(headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    : {
        "Content-Type": "application/json",
        ...(headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: mergedHeaders,
    body: formData ?? body,
    ...rest,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.error === "PASSWORD_CHANGE_REQUIRED" && typeof window !== "undefined") {
      if (!window.location.pathname.includes("/change-password")) {
        window.location.assign("/admin/change-password");
      }
    }
    if (
      (res.status === 401 || data.error === "Unauthorized" || data.error === "Session expired") &&
      typeof window !== "undefined"
    ) {
      // Stale token — clear so login can recover cleanly
      if (path !== "/api/auth/login" && path !== "/api/auth/me") {
        setAuthToken(null);
      }
    }
    const err =
      typeof data.error === "string"
        ? data.error
        : data.error?.formErrors?.[0] || data.message || res.statusText;
    throw new Error(err || "Request failed");
  }
  return data as T;
}
