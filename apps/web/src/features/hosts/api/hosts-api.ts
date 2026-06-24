import type { Paginated } from '@entrio/types';
import { apiFetch } from '@/lib/api/client';
import type { PreRegisterInput, RestrictionInput } from '../schema';
import type { HostRestriction, HostVisit } from '../types';

/**
 * Hosts data access layer (PRD §4.4/§4.5/§4.11). Endpoints are "me"-scoped — the
 * host is the authenticated user server-side, so the `hostId` args are ignored
 * (kept for call-site compatibility).
 */

// The current host is derived from the session; this is a placeholder for callers.
export const MOCK_CURRENT_HOST = { id: 'me', fullName: 'You' };

export function getHostVisits(_hostId: string): Promise<HostVisit[]> {
  return apiFetch<HostVisit[]>('/api/hosts/me/visits');
}

export interface HostVisitsQuery {
  search: string;
  status: string;
  page: number;
  pageSize: number;
}

/** Paginated + searchable view of the host's own visits (My Visitors table). */
export function getHostVisitsPaged(q: HostVisitsQuery): Promise<Paginated<HostVisit>> {
  const params = new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize) });
  if (q.search) params.set('search', q.search);
  if (q.status && q.status !== 'all') params.set('status', q.status);
  return apiFetch<Paginated<HostVisit>>(`/api/hosts/me/visits/paged?${params.toString()}`);
}

export function preRegisterVisit(_hostId: string, input: PreRegisterInput): Promise<HostVisit> {
  return apiFetch<HostVisit>('/api/hosts/me/visits', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function markOnMyWay(visitId: string): Promise<HostVisit> {
  return apiFetch<HostVisit>(`/api/hosts/me/visits/${visitId}/on-my-way`, { method: 'POST' });
}

/** Send a reply about a visit to the front desk / security. */
export function respondToVisit(visitId: string, message: string): Promise<{ recipients: number }> {
  return apiFetch<{ recipients: number }>(`/api/hosts/me/visits/${visitId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function getRestrictions(_hostId: string): Promise<HostRestriction[]> {
  return apiFetch<HostRestriction[]>('/api/hosts/me/restrictions');
}

export function addRestriction(_hostId: string, input: RestrictionInput): Promise<HostRestriction> {
  return apiFetch<HostRestriction>('/api/hosts/me/restrictions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function liftRestriction(id: string): Promise<void> {
  return apiFetch<void>(`/api/hosts/me/restrictions/${id}`, { method: 'DELETE' });
}
