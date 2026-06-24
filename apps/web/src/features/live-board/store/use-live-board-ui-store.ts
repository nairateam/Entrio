import { create } from 'zustand';
import type { BoardView, BoardVisit, StatusFilter } from '../types';

/**
 * Client-only UI state for the live board (filters, view toggle, which modal is
 * open). Server data lives in React Query (see hooks/use-live-board.ts).
 */
interface LiveBoardUiState {
  query: string;
  statusFilter: StatusFilter;
  view: BoardView;
  pendingCheckout: BoardVisit | null;
  pendingFlag: BoardVisit | null;
  flagNote: string;

  setQuery: (query: string) => void;
  setStatusFilter: (status: StatusFilter) => void;
  setView: (view: BoardView) => void;
  requestCheckout: (visit: BoardVisit) => void;
  cancelCheckout: () => void;
  requestFlag: (visit: BoardVisit) => void;
  setFlagNote: (note: string) => void;
  cancelFlag: () => void;
}

export const useLiveBoardUiStore = create<LiveBoardUiState>((set) => ({
  query: '',
  statusFilter: 'all',
  view: 'today',
  pendingCheckout: null,
  pendingFlag: null,
  flagNote: '',

  setQuery: (query) => set({ query }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setView: (view) => set({ view }),
  requestCheckout: (visit) => set({ pendingCheckout: visit }),
  cancelCheckout: () => set({ pendingCheckout: null }),
  requestFlag: (visit) => set({ pendingFlag: visit, flagNote: '' }),
  setFlagNote: (flagNote) => set({ flagNote }),
  cancelFlag: () => set({ pendingFlag: null, flagNote: '' }),
}));
