import { VisitStatus, type User, type Visit, type Visitor } from '@entrio/types';
import {
  MOCK_HOST_RESTRICTIONS,
  MOCK_HOSTS,
  MOCK_LAST_VISITS,
  MOCK_VISITORS,
  MOCK_WORKING_HOURS,
} from '../fixtures';
import type {
  CheckInPayload,
  CheckInResult,
  NewVisitorInput,
  SecurityCheckResult,
  VisitorSearchResult,
  WorkingHoursStatus,
} from '../types';

/**
 * Check-in data access layer.
 *
 * Every function is written as the seam where a real network call will go.
 * Today it resolves against in-memory fixtures after a simulated round-trip;
 * later each body becomes a single `apiFetch<T>(...)` call against apps/api —
 * the signatures and return types are already final, so callers won't change.
 *
 * Example of the eventual implementation:
 *   return apiFetch<VisitorSearchResult[]>(
 *     `/api/visitors/search?q=${encodeURIComponent(query)}`,
 *   );
 */

const SIMULATED_LATENCY_MS = 350;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const digitsOf = (value: string) => value.replace(/\D/g, '');

/** Search visitors by name or phone — returns ALL matches (PRD §4.1.1, §4.13). */
export async function searchVisitors(query: string): Promise<VisitorSearchResult[]> {
  await wait();
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const qDigits = digitsOf(q);
  const matches = MOCK_VISITORS.filter((visitor) => {
    const byName = visitor.fullName.toLowerCase().includes(q);
    const byPhone = qDigits.length >= 3 && digitsOf(visitor.phone).includes(qDigits);
    return byName || byPhone;
  });

  return matches.map((visitor) => ({
    visitor,
    lastVisitAt: MOCK_LAST_VISITS[visitor.id] ?? null,
  }));
}

/** Hosts a visitor can be received by (PRD §4.1.6 host selection). */
export async function getHosts(): Promise<User[]> {
  await wait(150);
  return MOCK_HOSTS;
}

/** Create a visitor record when no match exists (PRD §4.1.3). */
export async function createVisitor(input: NewVisitorInput): Promise<Visitor> {
  await wait();
  return {
    id: `vis-new-${Date.now()}`,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    photoUrl: null,
    isBlocked: false,
    blockReason: null,
    blockedBy: null,
    blockedAt: null,
    isFlagged: false,
    flaggedBy: null,
    flaggedAt: null,
    flagNote: null,
    createdAt: new Date().toISOString(),
  };
}

/** Working-hours gate (PRD §4.4 / §4.8). */
export async function checkWorkingHours(at: Date = new Date()): Promise<WorkingHoursStatus> {
  await wait(200);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const rule = MOCK_WORKING_HOURS.find((r) => r.dayOfWeek === at.getDay());
  const dayLabel = dayNames[at.getDay()] ?? 'Today';

  if (!rule || !rule.isActive) {
    return { isOpen: false, dayLabel, opensAt: null, closesAt: null };
  }

  const minutesNow = at.getHours() * 60 + at.getMinutes();
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const isOpen = minutesNow >= toMinutes(rule.openTime) && minutesNow < toMinutes(rule.closeTime);

  return { isOpen, dayLabel, opensAt: rule.openTime, closesAt: rule.closeTime };
}

/**
 * Request a working-hours override (PRD §4.8). A supervisor/admin approves or
 * denies; mocked here as an auto-approval after a short delay.
 */
export async function requestOverride(
  _reason: string,
): Promise<{ approved: boolean; approvedBy: string | null }> {
  await wait(600);
  return { approved: true, approvedBy: 'supervisor-1' };
}

/** Combined blocklist (§4.7) + host-restriction (§4.11) gate. */
export async function runSecurityCheck(
  visitorId: string,
  hostId: string,
): Promise<SecurityCheckResult> {
  await wait();
  const visitor = MOCK_VISITORS.find((v) => v.id === visitorId);
  const hostRestricted = MOCK_HOST_RESTRICTIONS.some(
    (r) => r.hostId === hostId && r.visitorId === visitorId,
  );

  return {
    blocked: Boolean(visitor?.isBlocked),
    blockReason: visitor?.blockReason ?? null,
    hostRestricted,
  };
}

/** Finalize the check-in: create the visit, generate a badge (PRD §4.1.8). */
export async function submitCheckIn(payload: CheckInPayload): Promise<CheckInResult> {
  await wait();
  const now = new Date().toISOString();
  const badgeCode = `ENT-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const visit: Visit = {
    id: `visit-${Date.now()}`,
    visitorId: payload.visitorId,
    hostId: payload.hostId,
    checkedInBy: 'mock-user-1',
    checkedOutBy: null,
    purpose: payload.purpose || null,
    status: VisitStatus.CHECKED_IN,
    checkInTime: now,
    checkOutTime: null,
    expectedTime: null,
    badgeCode,
    isOverride: payload.isOverride,
    overrideApprovedBy: payload.isOverride ? 'supervisor-1' : null,
    notes: null,
    createdAt: now,
  };

  return { visit };
}
