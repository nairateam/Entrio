'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * After a terminal screen, send the kiosk back to Welcome so the next visitor can
 * start (PRD v2 §7 idle reset). Returns the seconds remaining for an optional
 * countdown. Pass `active` true only on the final screens.
 */
export function useAutoReturn(active: boolean, seconds = 30): number {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!active) return;
    setRemaining(seconds);
    const tick = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    const done = setTimeout(() => router.push('/kiosk'), seconds * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [active, seconds, router]);

  return remaining;
}
