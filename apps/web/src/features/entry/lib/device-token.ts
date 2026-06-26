'use client';

/**
 * The shared-device token (PRD v2 §2.1) lives in localStorage and is sent as
 * `X-Device-Token` on every self-service call. It is paired once via /setup.
 */
const KEY = 'entrio-device-token';

export function getDeviceToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setDeviceToken(token: string): void {
  window.localStorage.setItem(KEY, token.trim());
}

export function clearDeviceToken(): void {
  window.localStorage.removeItem(KEY);
}
