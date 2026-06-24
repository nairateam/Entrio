import { create } from 'zustand';
import type { User } from '@entrio/types';
import { clearSession, readSession, writeSession } from '@/features/auth/session';

interface AuthState {
  user: User | null;
  /** Set the user directly (low-level; prefer signIn/signOut). */
  setUser: (user: User | null) => void;
  /** Authenticate: persist the session and set the user. */
  signIn: (user: User) => void;
  /** Clear the session and the user. */
  signOut: () => void;
  /** Restore the user from the persisted session on app load / refresh. */
  hydrate: () => void;
}

/**
 * Client-side auth/session state. The app starts signed out; the user is set by
 * the login flow (mock for now) and restored from the session cookie on refresh
 * via `hydrate()`. Route protection lives in middleware.ts.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  setUser: (user) => set({ user }),

  signIn: (user) => {
    writeSession(user);
    set({ user });
  },

  signOut: () => {
    clearSession();
    set({ user: null });
  },

  hydrate: () => {
    if (get().user) return;
    const user = readSession();
    if (user) set({ user });
  },
}));
