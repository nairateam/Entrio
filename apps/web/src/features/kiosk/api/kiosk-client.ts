import { ApiError } from '@/lib/api/client';
import { getDeviceToken } from '../lib/device-token';

// Same base resolution as the main apiFetch: same-origin (proxied) in prod, local API in dev.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');

/**
 * Fetch wrapper for the visitor-facing self-service API. Unlike `apiFetch`, it
 * carries the device token header instead of the human JWT cookie.
 */
export async function kioskFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getDeviceToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Device-Token': token } : {}),
      ...init?.headers,
    },
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

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
