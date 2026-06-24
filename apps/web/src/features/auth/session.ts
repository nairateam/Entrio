import type { User } from '@entrio/types';
import { SESSION_COOKIE } from './session-config';

/**
 * Client-side session persistence — MOCK.
 *
 * Until the backend auth module lands, we keep the signed-in user in a readable
 * cookie so the middleware can gate routes and the store can rehydrate on
 * refresh. When the real API ships it sets an httpOnly cookie (unreadable from
 * JS), so:
 *   - `writeSession` / `clearSession` go away (the server manages the cookie), and
 *   - `readSession` is replaced by a `GET /api/auth/me` call in the store's
 *     `hydrate()` to recover the user after a refresh.
 * The middleware's cookie-presence check is unaffected by that swap.
 */

const MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

export function writeSession(user: User): void {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function readSession(): User | null {
  if (typeof document === 'undefined') return null;
  const entry = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!entry) return null;
  try {
    return JSON.parse(decodeURIComponent(entry.slice(SESSION_COOKIE.length + 1))) as User;
  } catch {
    return null;
  }
}
