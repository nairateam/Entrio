import { create } from 'zustand';
import * as api from '../api/notifications-api';
import type { NotificationItem } from '../types';

interface NotificationsState {
  items: NotificationItem[];
  isLoading: boolean;

  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      set({ items: await api.getNotifications() });
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) });
    await api.markRead(id);
  },

  markAllRead: async () => {
    set({ items: get().items.map((n) => ({ ...n, read: true })) });
    await api.markAllRead();
  },
}));
