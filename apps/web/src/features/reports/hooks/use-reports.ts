import { useQuery } from '@tanstack/react-query';
import * as api from '../api/reports-api';
import type { ReportFilters } from '../types';

export const reportKeys = {
  report: (filters: ReportFilters) => ['reports', 'data', filters] as const,
  filterOptions: ['reports', 'filter-options'] as const,
};

/** Aggregated report + filtered rows; refetches when filters change. */
export function useReport(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.report(filters),
    queryFn: () => api.getReport(filters),
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: reportKeys.filterOptions,
    queryFn: api.getFilterOptions,
    staleTime: 5 * 60_000,
  });
}
