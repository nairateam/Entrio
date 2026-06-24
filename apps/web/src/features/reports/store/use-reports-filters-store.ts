import { create } from 'zustand';
import type { ReportFilters } from '../types';
import { defaultFilters } from '../utils';

/**
 * Client-only report filter state, shared between the filters bar and the
 * dashboard. The report data itself comes from React Query (hooks/use-reports.ts).
 */
interface ReportsFiltersState {
  filters: ReportFilters;
  setFilter: (patch: Partial<ReportFilters>) => void;
  resetFilters: () => void;
}

export const useReportsFiltersStore = create<ReportsFiltersState>((set) => ({
  filters: defaultFilters(),
  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: defaultFilters() }),
}));
