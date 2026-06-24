import { apiFetch } from '@/lib/api/client';
import type { FilterOptions, ReportData, ReportFilters, ReportVisit } from '../types';

/** Reports data access layer (PRD §4.9) — the server does the aggregation. */

export function getReport(
  filters: ReportFilters,
): Promise<{ data: ReportData; rows: ReportVisit[] }> {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    department: filters.department,
    hostId: filters.hostId,
    status: filters.status,
  });
  return apiFetch<{ data: ReportData; rows: ReportVisit[] }>(`/api/reports?${params.toString()}`);
}

export function getFilterOptions(): Promise<FilterOptions> {
  return apiFetch<FilterOptions>('/api/reports/filter-options');
}
