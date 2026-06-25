/**
 * Thin fetch wrapper for talking to the Entrio API.
 * Business endpoints are added per-feature under src/features/<x>/api.
 */
/**
 * API base. In production, default to a same-origin relative base ('') so calls
 * hit /api on this origin and are proxied to the backend (see next.config.mjs) —
 * this keeps the auth cookie first-party. In dev, default to the local API.
 * Override with NEXT_PUBLIC_API_URL (must include the scheme, e.g. https://…).
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');

/** Error carrying the HTTP status + the API's message (so callers can branch on 401 etc.). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    // The JWT rides an httpOnly cookie — always send/receive it.
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body?.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch {
      // non-JSON error body — keep the status line
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content (logout, mark-read, deletes) has no body.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
