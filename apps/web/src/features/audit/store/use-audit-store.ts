import { create } from 'zustand';
import * as api from '../api/audit-api';
import type { AuditEntry, AuditFilters } from '../types';
import { emptyFilters } from '../utils';

interface AuditState {
  entries: AuditEntry[];
  filters: AuditFilters;
  isLoading: boolean;
  error: string | null;

  load: () => Promise<void>;
  setFilter: (patch: Partial<AuditFilters>) => Promise<void>;
  resetFilters: () => Promise<void>;
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  filters: emptyFilters(),
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await api.getAuditLog(get().filters);
      set({ entries });
    } catch {
      set({ error: 'Could not load the audit log.' });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilter: async (patch) => {
    set({ filters: { ...get().filters, ...patch } });
    await get().load();
  },

  resetFilters: async () => {
    set({ filters: emptyFilters() });
    await get().load();
  },
}));
