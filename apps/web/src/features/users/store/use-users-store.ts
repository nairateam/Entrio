import { create } from 'zustand';
import type { User } from '@entrio/types';
import { toast } from '@/components/ui';
import * as api from '../api/users-api';
import type { InviteInput } from '../schema';

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  togglingId: string | null;
  isInviteOpen: boolean;

  load: () => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  openInvite: () => void;
  closeInvite: () => void;
  invite: (input: InviteInput) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  togglingId: null,
  isInviteOpen: false,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      set({ users: await api.getUsers() });
    } catch {
      set({ error: 'Could not load users.' });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleActive: async (id, isActive) => {
    set({ togglingId: id });
    try {
      const updated = await api.setUserActive(id, isActive);
      set({ users: get().users.map((u) => (u.id === id ? updated : u)) });
      toast.success(isActive ? 'User activated.' : 'User deactivated.');
    } catch {
      toast.error('Could not update the user.');
    } finally {
      set({ togglingId: null });
    }
  },

  openInvite: () => set({ isInviteOpen: true }),
  closeInvite: () => set({ isInviteOpen: false }),

  invite: async (input) => {
    const created = await api.inviteUser(input);
    set({ users: [created, ...get().users], isInviteOpen: false });
    toast.success(`Invited ${created.fullName}.`);
  },
}));
