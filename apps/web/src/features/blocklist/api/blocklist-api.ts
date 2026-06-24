import type { Paginated } from '@entrio/types';
import { apiFetch } from '@/lib/api/client';
import type { AdminVisitor } from '../types';

/** Blocklist / flag data access layer (PRD §4.7/§4.12). */

export interface BlocklistQuery {
  search: string;
  page: number;
  pageSize: number;
}

function buildParams(q: BlocklistQuery): string {
  const params = new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize) });
  if (q.search) params.set('search', q.search);
  return params.toString();
}

export function getBlockedVisitors(q: BlocklistQuery): Promise<Paginated<AdminVisitor>> {
  return apiFetch<Paginated<AdminVisitor>>(`/api/blocklist?${buildParams(q)}`);
}

export function getFlaggedVisitors(q: BlocklistQuery): Promise<Paginated<AdminVisitor>> {
  return apiFetch<Paginated<AdminVisitor>>(`/api/blocklist/flagged?${buildParams(q)}`);
}

export function blockVisitor(id: string, reason: string): Promise<AdminVisitor> {
  return apiFetch<AdminVisitor>(`/api/blocklist/${id}/block`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function unblockVisitor(id: string): Promise<AdminVisitor> {
  return apiFetch<AdminVisitor>(`/api/blocklist/${id}/unblock`, { method: 'POST' });
}

export function clearFlag(id: string): Promise<AdminVisitor> {
  return apiFetch<AdminVisitor>(`/api/blocklist/${id}/clear-flag`, { method: 'POST' });
}
