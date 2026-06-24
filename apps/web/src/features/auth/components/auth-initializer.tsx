'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Restores the signed-in user from the persisted session on first load, so a
 * refresh keeps the user logged in. Renders nothing. Mounted once in the root
 * layout. (When real auth lands, hydrate() calls GET /api/auth/me instead.)
 */
export function AuthInitializer() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
