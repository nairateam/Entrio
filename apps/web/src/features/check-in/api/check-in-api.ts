import type { User, Visitor } from '@entrio/types';
import { apiFetch } from '@/lib/api/client';
import type {
  CheckInPayload,
  CheckInResult,
  CheckedInVisit,
  NewVisitorInput,
  SecurityCheckResult,
  VisitorSearchResult,
  WorkingHoursStatus,
} from '../types';

/** Check-in data access layer (PRD §4.1–4.2 + gates). */

/** Search visitors by name or phone — returns ALL matches (PRD §4.13). */
export function searchVisitors(query: string): Promise<VisitorSearchResult[]> {
  return apiFetch<VisitorSearchResult[]>(`/api/visitors/search?q=${encodeURIComponent(query)}`);
}

/** Active hosts the visitor can be received by (PRD §4.1.6). */
export function getHosts(): Promise<User[]> {
  return apiFetch<User[]>('/api/hosts');
}

/** Create a visitor when no match exists (PRD §4.1.3). */
export function createVisitor(input: NewVisitorInput): Promise<Visitor> {
  return apiFetch<Visitor>('/api/visitors', {
    method: 'POST',
    body: JSON.stringify({ fullName: input.fullName, phone: input.phone, email: input.email }),
  });
}

/** Working-hours open/closed status (PRD §4.8). */
export function checkWorkingHours(): Promise<WorkingHoursStatus> {
  return apiFetch<WorkingHoursStatus>('/api/working-hours/status');
}

/**
 * Request a working-hours override (PRD §4.8). Creates a *pending* request; an
 * admin must approve it before check-in succeeds. Returns the request id.
 */
export function requestOverride(input: {
  visitorId: string;
  hostId: string;
  reason: string;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/api/overrides', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Combined blocklist (§4.7) + host-restriction (§4.11) gate. */
export function runSecurityCheck(visitorId: string, hostId: string): Promise<SecurityCheckResult> {
  return apiFetch<SecurityCheckResult>(
    `/api/visitors/${visitorId}/security-check?hostId=${encodeURIComponent(hostId)}`,
  );
}

/** Finalize the check-in (PRD §4.1.8). 422 if an override is required/unapproved. */
export async function submitCheckIn(payload: CheckInPayload): Promise<CheckInResult> {
  // Only send a newly captured headshot (a base64 data URL); an unchanged existing
  // photo is an http URL the server already has, so we leave it untouched.
  const newHeadshot =
    payload.headshot?.startsWith('data:') ? payload.headshot : undefined;

  const visit = await apiFetch<CheckedInVisit>('/api/visits/check-in', {
    method: 'POST',
    body: JSON.stringify({
      visitorId: payload.visitorId,
      hostId: payload.hostId,
      purpose: payload.purpose,
      overrideRequestId: payload.overrideRequestId ?? undefined,
      expectedVisitId: payload.expectedVisitId ?? undefined,
      headshot: newHeadshot,
    }),
  });
  return { visit };
}
