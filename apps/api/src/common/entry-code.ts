import { randomInt } from 'node:crypto';

/**
 * A short 4-digit entry code (PRD v2 §3.2) — easy to read in an email and type
 * on any keypad. Uniqueness is only required among *active* visits (expected /
 * checked_in); codes are released (set null) at check-out, so the 4-digit space
 * is recycled rather than exhausted.
 */
export function generateEntryCode(): string {
  return String(randomInt(0, 10000)).padStart(4, '0');
}

/** Normalize a code typed by a visitor (trim, digits only) for lookup. */
export function normalizeEntryCode(code: string): string {
  return code.trim().replace(/\D/g, '');
}
