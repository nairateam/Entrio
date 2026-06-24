import { MOCK_ACCOUNTS } from '../fixtures';
import type { LoginInput } from '../schema';
import type { LoginResult } from '../types';

/**
 * Auth data access layer.
 *
 * These are the seams where the real network calls go once the backend auth
 * module is ready. Each mock body is replaced by the single commented line
 * above it — signatures and return types are already final, so callers (the
 * login form / auth store) won't change.
 *
 * The API sets/clears the JWT as an httpOnly cookie, so `credentials: 'include'`
 * is what carries the session — there is no token to handle in JS.
 */

const SIMULATED_LATENCY_MS = 400;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Thrown by the mock when no demo account matches; mirrors a 401 from the API. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
    this.name = 'InvalidCredentialsError';
  }
}

export async function login(credentials: LoginInput): Promise<LoginResult> {
  // return apiFetch<LoginResult>('/api/auth/login', { method: 'POST', credentials: 'include', body: JSON.stringify(credentials) });
  await wait();
  const user = MOCK_ACCOUNTS[credentials.email.trim().toLowerCase()];
  if (!user) throw new InvalidCredentialsError();
  return { user };
}

export async function logout(): Promise<void> {
  // return apiFetch<void>('/api/auth/logout', { method: 'POST', credentials: 'include' });
  await wait(150);
}
