import { create } from 'zustand';
import { toast } from '@/components/ui';
import * as api from '../api/overrides-api';
import type { OverrideRequest } from '../types';

interface OverridesState {
  requests: OverrideRequest[];
  isLoading: boolean;
  error: string | null;
  actingId: string | null;

  load: () => Promise<void>;
  approve: (id: string) => Promise<void>;
  deny: (id: string) => Promise<void>;
}

export const useOverridesStore = create<OverridesState>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,
  actingId: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ requests: await api.getOverrideRequests() });
    } catch {
      set({ error: 'Could not load override requests.' });
    } finally {
      set({ isLoading: false });
    }
  },

  approve: async (id) => {
    set({ actingId: id });
    try {
      const updated = await api.approveOverride(id);
      set({ requests: get().requests.map((r) => (r.id === id ? updated : r)) });
      toast.success('Override approved.');
    } catch {
      toast.error('Could not approve the request.');
    } finally {
      set({ actingId: null });
    }
  },

  deny: async (id) => {
    set({ actingId: id });
    try {
      const updated = await api.denyOverride(id);
      set({ requests: get().requests.map((r) => (r.id === id ? updated : r)) });
      toast.success('Override denied.');
    } catch {
      toast.error('Could not deny the request.');
    } finally {
      set({ actingId: null });
    }
  },
}));
