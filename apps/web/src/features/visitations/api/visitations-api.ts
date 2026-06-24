import type { Paginated } from '@entrio/types';
import { apiFetch } from '@/lib/api/client';
import type { Visitation } from '../types';

export interface VisitationsQuery {
  from: string;
  to: string;
  search: string;
  status: string;
  page: number;
  pageSize: number;
}

/** A page of visitations within a date range (server-filtered + paginated). */
export function getVisitations(q: VisitationsQuery): Promise<Paginated<Visitation>> {
  const params = new URLSearchParams({
    from: q.from,
    to: q.to,
    page: String(q.page),
    pageSize: String(q.pageSize),
  });
  if (q.search) params.set('search', q.search);
  if (q.status && q.status !== 'all') params.set('status', q.status);
  return apiFetch<Paginated<Visitation>>(`/api/visits?${params.toString()}`);
}
