import { ApiError, apiFetch } from '@/lib/api/client';
import type { LoginInput } from '../schema';
import type { LoginResult } from '../types';

/**
 * Auth data access layer. The JWT rides an httpOnly cookie set by the API, so
 * `apiFetch` (credentials: 'include') carries the session — there is no token to
 * handle in JS.
 */

/** Thrown when credentials don't match (maps a 401 from the API). */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
    this.name = 'InvalidCredentialsError';
  }
}

export async function login(credentials: LoginInput): Promise<LoginResult> {
  try {
    return await apiFetch<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw new InvalidCredentialsError();
    throw err;
  }
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/api/auth/logout', { method: 'POST' });
}

/** Validate an invite/reset token; resolves the target email or throws on invalid/expired. */
export function validateSetPasswordToken(token: string): Promise<{ email: string }> {
  return apiFetch<{ email: string }>(`/api/auth/set-password?token=${encodeURIComponent(token)}`);
}

/** Set a password via an invite token and start the session (cookie set by the API). */
export function setPassword(token: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>('/api/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

/** Current session user — used to rehydrate after a refresh. Null if unauthenticated. */
export async function me(): Promise<LoginResult | null> {
  try {
    return await apiFetch<LoginResult>('/api/auth/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}
