import { create } from 'zustand';
import { toast } from '@/components/ui';
import * as api from '../api/live-board-api';
import type { BoardView, BoardVisit, StatusFilter } from '../types';

interface LiveBoardState {
  visits: BoardVisit[];
  isLoading: boolean;
  error: string | null;

  // controls
  query: string;
  statusFilter: StatusFilter;
  view: BoardView;

  // check-out confirm modal (PRD §4.3)
  pendingCheckout: BoardVisit | null;
  isCheckingOut: boolean;

  // flag-for-review modal (PRD §4.12)
  pendingFlag: BoardVisit | null;
  flagNote: string;
  isFlagging: boolean;

  // actions
  load: () => Promise<void>;
  setQuery: (query: string) => void;
  setStatusFilter: (status: StatusFilter) => void;
  setView: (view: BoardView) => void;
  requestCheckout: (visit: BoardVisit) => void;
  cancelCheckout: () => void;
  confirmCheckout: () => Promise<void>;
  requestFlag: (visit: BoardVisit) => void;
  setFlagNote: (note: string) => void;
  cancelFlag: () => void;
  confirmFlag: () => Promise<void>;
}

export const useLiveBoardStore = create<LiveBoardState>((set, get) => ({
  visits: [],
  isLoading: false,
  error: null,
  query: '',
  statusFilter: 'all',
  view: 'today',
  pendingCheckout: null,
  isCheckingOut: false,
  pendingFlag: null,
  flagNote: '',
  isFlagging: false,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const visits = await api.getTodayVisits();
      set({ visits });
    } catch {
      set({ error: 'Could not load today’s visits.' });
    } finally {
      set({ isLoading: false });
    }
  },

  setQuery: (query) => set({ query }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setView: (view) => set({ view }),

  requestCheckout: (visit) => set({ pendingCheckout: visit }),
  cancelCheckout: () => set({ pendingCheckout: null }),

  confirmCheckout: async () => {
    const target = get().pendingCheckout;
    if (!target) return;
    set({ isCheckingOut: true, error: null });
    try {
      const updated = await api.checkOutVisit(target.id);
      set({
        visits: get().visits.map((v) => (v.id === updated.id ? updated : v)),
        pendingCheckout: null,
      });
    } catch {
      set({ error: 'Check-out failed. Please try again.' });
    } finally {
      set({ isCheckingOut: false });
    }
  },

  requestFlag: (visit) => set({ pendingFlag: visit, flagNote: '' }),
  setFlagNote: (flagNote) => set({ flagNote }),
  cancelFlag: () => set({ pendingFlag: null, flagNote: '' }),

  confirmFlag: async () => {
    const target = get().pendingFlag;
    const note = get().flagNote.trim();
    if (!target || !note) return;
    set({ isFlagging: true, error: null });
    try {
      await api.flagVisit(target.id, note);
      set({ pendingFlag: null, flagNote: '' });
      toast.success(`${target.visitorName} flagged for review.`);
    } catch {
      toast.error('Could not flag the visitor.');
    } finally {
      set({ isFlagging: false });
    }
  },
}));
