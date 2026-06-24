import { create } from 'zustand';
import type { AdminVisitor, BlocklistAction } from '../types';

/** Client-only state for the block/unblock/clear-flag confirm modal. */
interface BlocklistUiState {
  pending: { action: BlocklistAction; visitor: AdminVisitor } | null;
  reason: string;
  requestAction: (action: BlocklistAction, visitor: AdminVisitor) => void;
  setReason: (reason: string) => void;
  cancelAction: () => void;
}

export const useBlocklistUiStore = create<BlocklistUiState>((set) => ({
  pending: null,
  reason: '',
  requestAction: (action, visitor) => set({ pending: { action, visitor }, reason: '' }),
  setReason: (reason) => set({ reason }),
  cancelAction: () => set({ pending: null, reason: '' }),
}));
