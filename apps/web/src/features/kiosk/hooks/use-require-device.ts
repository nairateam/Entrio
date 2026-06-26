'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDeviceToken } from '../lib/device-token';

/**
 * Redirects to /kiosk/setup when no device token is paired. Returns whether a
 * token is present so callers can avoid a flash before the redirect.
 */
export function useRequireDevice(): { ready: boolean } {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getDeviceToken()) {
      setReady(true);
    } else {
      router.replace('/kiosk/setup');
    }
  }, [router]);

  return { ready };
}
