import { create } from 'zustand';
import * as api from '../api/reports-api';
import type { FilterOptions, ReportData, ReportFilters, ReportVisit } from '../types';
import { defaultFilters, downloadCsv, toCsv } from '../utils';

interface ReportsState {
  filters: ReportFilters;
  options: FilterOptions;
  data: ReportData | null;
  rows: ReportVisit[];
  isLoading: boolean;
  error: string | null;

  init: () => Promise<void>;
  setFilter: (patch: Partial<ReportFilters>) => Promise<void>;
  resetFilters: () => Promise<void>;
  exportCsv: () => void;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  filters: defaultFilters(),
  options: { departments: [], hosts: [] },
  data: null,
  rows: [],
  isLoading: false,
  error: null,

  init: async () => {
    set({ isLoading: true, error: null });
    try {
      const [options] = await Promise.all([api.getFilterOptions()]);
      const { data, rows } = await api.getReport(get().filters);
      set({ options, data, rows });
    } catch {
      set({ error: 'Could not load report data.' });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilter: async (patch) => {
    const filters = { ...get().filters, ...patch };
    set({ filters, isLoading: true, error: null });
    try {
      const { data, rows } = await api.getReport(filters);
      set({ data, rows });
    } catch {
      set({ error: 'Could not apply filters.' });
    } finally {
      set({ isLoading: false });
    }
  },

  resetFilters: async () => {
    await get().setFilter(defaultFilters());
  },

  exportCsv: () => {
    const { rows, filters } = get();
    downloadCsv(`entrio-report_${filters.from}_to_${filters.to}.csv`, toCsv(rows));
  },
}));
