import { create } from 'zustand';
import * as api from '../api/hosts-api';
import type { HostVisit } from '../types';

interface HostState {
  visits: HostVisit[];
  isLoading: boolean;
  error: string | null;
  /** Id of the visit whose "On My Way" request is in flight. */
  markingId: string | null;

  load: (hostId: string) => Promise<void>;
  markOnMyWay: (visitId: string) => Promise<void>;
}

export const useHostStore = create<HostState>((set, get) => ({
  visits: [],
  isLoading: false,
  error: null,
  markingId: null,

  load: async (hostId) => {
    set({ isLoading: true, error: null });
    try {
      const visits = await api.getHostVisits(hostId);
      set({ visits });
    } catch {
      set({ error: 'Could not load your visits.' });
    } finally {
      set({ isLoading: false });
    }
  },

  markOnMyWay: async (visitId) => {
    set({ markingId: visitId, error: null });
    try {
      const updated = await api.markOnMyWay(visitId);
      set({ visits: get().visits.map((v) => (v.id === updated.id ? updated : v)) });
    } catch {
      set({ error: 'Could not update status. Please try again.' });
    } finally {
      set({ markingId: null });
    }
  },
}));
