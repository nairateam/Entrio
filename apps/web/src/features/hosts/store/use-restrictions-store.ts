import { create } from 'zustand';
import { toast } from '@/components/ui';
import * as api from '../api/hosts-api';
import type { RestrictionInput } from '../schema';
import type { HostRestriction } from '../types';

interface RestrictionsState {
  restrictions: HostRestriction[];
  isLoading: boolean;
  error: string | null;
  liftingId: string | null;

  load: (hostId: string) => Promise<void>;
  add: (hostId: string, input: RestrictionInput) => Promise<void>;
  lift: (id: string) => Promise<void>;
}

export const useRestrictionsStore = create<RestrictionsState>((set, get) => ({
  restrictions: [],
  isLoading: false,
  error: null,
  liftingId: null,

  load: async (hostId) => {
    set({ isLoading: true, error: null });
    try {
      set({ restrictions: await api.getRestrictions(hostId) });
    } catch {
      set({ error: 'Could not load restrictions.' });
    } finally {
      set({ isLoading: false });
    }
  },

  add: async (hostId, input) => {
    const created = await api.addRestriction(hostId, input);
    set({ restrictions: [created, ...get().restrictions] });
    toast.success('Restriction added.');
  },

  lift: async (id) => {
    set({ liftingId: id });
    try {
      await api.liftRestriction(id);
      set({ restrictions: get().restrictions.filter((r) => r.id !== id) });
      toast.success('Restriction lifted.');
    } catch {
      toast.error('Could not lift the restriction.');
    } finally {
      set({ liftingId: null });
    }
  },
}));
