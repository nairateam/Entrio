'use client';

import { useQuery } from '@tanstack/react-query';
import { kioskApi } from '../api/kiosk-api';

/** The active consent policy (PRD v2 §5.3) — rarely changes, so cache it generously. */
export function useConsent() {
  return useQuery({
    queryKey: ['kiosk', 'consent'],
    queryFn: () => kioskApi.consent(),
    staleTime: 60 * 60 * 1000,
  });
}
