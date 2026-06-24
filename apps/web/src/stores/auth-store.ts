import { create } from 'zustand';
import type { User } from '@entrio/types';
import { me } from '@/features/auth/api/auth-api';

interface AuthState {
  user: User | null;
  /** Set the user directly (low-level; prefer signIn/signOut). */
  setUser: (user: User | null) => void;
  /** Record the signed-in user after a successful login (API set the cookie). */
  signIn: (user: User) => void;
  /** Clear the user locally (call authApi.logout() to clear the server cookie). */
  signOut: () => void;
  /** Restore the user from the session cookie on app load / refresh, via GET /api/auth/me. */
  hydrate: () => Promise<void>;
}

/**
 * Client-side auth/session state. The app starts signed out; login sets the user
 * and `hydrate()` restores it after a refresh. The JWT lives in an httpOnly
 * cookie owned by the API — never touched here. Route protection is middleware.ts.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  setUser: (user) => set({ user }),
  signIn: (user) => set({ user }),
  signOut: () => set({ user: null }),

  hydrate: async () => {
    if (get().user) return;
    const result = await me();
    if (result) set({ user: result.user });
  },
}));
