import { apiFetch } from '@/lib/api/client';
import type { OverrideRequest } from '../types';

/** Override-request data access layer (PRD §4.8). */

export function getOverrideRequests(): Promise<OverrideRequest[]> {
  return apiFetch<OverrideRequest[]>('/api/overrides');
}

export function approveOverride(id: string): Promise<OverrideRequest> {
  return apiFetch<OverrideRequest>(`/api/overrides/${id}/approve`, { method: 'POST' });
}

export function denyOverride(id: string): Promise<OverrideRequest> {
  return apiFetch<OverrideRequest>(`/api/overrides/${id}/deny`, { method: 'POST' });
}
