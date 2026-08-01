const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { formData?: FormData } = {}
): Promise<T> {
  const { formData, headers, body, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: formData
      ? headers
      : { "Content-Type": "application/json", ...(headers || {}) },
    body: formData ?? body,
    ...rest,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = typeof data.error === "string" ? data.error : data.error?.formErrors?.[0] || res.statusText;
    throw new Error(err || "Request failed");
  }
  return data as T;
}
