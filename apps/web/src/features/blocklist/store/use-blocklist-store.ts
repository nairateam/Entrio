import { create } from 'zustand';
import * as api from '../api/blocklist-api';
import type { AdminVisitor, BlocklistAction } from '../types';

interface PendingAction {
  action: BlocklistAction;
  visitor: AdminVisitor;
}

interface BlocklistState {
  blocked: AdminVisitor[];
  flagged: AdminVisitor[];
  isLoading: boolean;
  error: string | null;

  // confirm/reason modal
  pending: PendingAction | null;
  reason: string;
  isSubmitting: boolean;

  load: () => Promise<void>;
  requestAction: (action: BlocklistAction, visitor: AdminVisitor) => void;
  setReason: (reason: string) => void;
  cancelAction: () => void;
  confirmAction: () => Promise<void>;
}

export const useBlocklistStore = create<BlocklistState>((set, get) => ({
  blocked: [],
  flagged: [],
  isLoading: false,
  error: null,
  pending: null,
  reason: '',
  isSubmitting: false,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const [blocked, flagged] = await Promise.all([
        api.getBlockedVisitors(),
        api.getFlaggedVisitors(),
      ]);
      set({ blocked, flagged });
    } catch {
      set({ error: 'Could not load visitor records.' });
    } finally {
      set({ isLoading: false });
    }
  },

  requestAction: (action, visitor) => set({ pending: { action, visitor }, reason: '' }),
  setReason: (reason) => set({ reason }),
  cancelAction: () => set({ pending: null, reason: '' }),

  confirmAction: async () => {
    const pending = get().pending;
    if (!pending) return;
    const { action, visitor } = pending;
    if (action === 'block' && !get().reason.trim()) return;

    set({ isSubmitting: true, error: null });
    try {
      if (action === 'block') await api.blockVisitor(visitor.id, get().reason);
      else if (action === 'unblock') await api.unblockVisitor(visitor.id);
      else await api.clearFlag(visitor.id);

      set({ pending: null, reason: '' });
      await get().load();
    } catch {
      set({ error: 'Action failed. Please try again.' });
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
