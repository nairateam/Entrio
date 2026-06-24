import type { Paginated } from '@entrio/types';
import { apiFetch } from '@/lib/api/client';
import type { AuditEntry } from '../types';

/** Audit log data access layer (PRD §2.1) — read-only, append-only on the server. */

export interface AuditQuery {
  search: string;
  action: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
}

export function getAuditLog(q: AuditQuery): Promise<Paginated<AuditEntry>> {
  const params = new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize) });
  if (q.search) params.set('search', q.search);
  if (q.action && q.action !== 'all') params.set('action', q.action);
  if (q.from) params.set('from', q.from);
  if (q.to) params.set('to', q.to);
  return apiFetch<Paginated<AuditEntry>>(`/api/audit?${params.toString()}`);
}
