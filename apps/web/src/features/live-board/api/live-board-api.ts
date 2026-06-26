import { apiFetch } from '@/lib/api/client';
import type { BoardVisit } from '../types';

/** Live-board data access layer (PRD §4.3 board / §4.10 roll call). */

export function getTodayVisits(): Promise<BoardVisit[]> {
  return apiFetch<BoardVisit[]>('/api/visits/today');
}

/** Check a visitor out (PRD §4.3). Returns the updated row. */
export function checkOutVisit(visitId: string): Promise<BoardVisit> {
  return apiFetch<BoardVisit>(`/api/visits/${visitId}/check-out`, { method: 'POST' });
}

/** Flag a visitor for review (PRD §4.12) — escalates to an admin, no entry denial. */
export function flagVisit(visitorId: string, note: string): Promise<void> {
  return apiFetch<void>(`/api/visitors/${visitorId}/flag`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

/** Staff-only host directory (for assigning a walk-in's host). */
export interface DirectoryHost {
  id: string;
  fullName: string;
  department: string | null;
}

export function getHostDirectory(): Promise<DirectoryHost[]> {
  return apiFetch<DirectoryHost[]>('/api/hosts');
}

/** Assign a host to a walk-in that checked in without one (PRD v2) — nudges the host. */
export function assignHost(visitId: string, hostId: string): Promise<BoardVisit> {
  return apiFetch<BoardVisit>(`/api/visits/${visitId}/assign-host`, {
    method: 'POST',
    body: JSON.stringify({ hostId }),
  });
}
