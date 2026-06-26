'use client';

import { useQuery } from '@tanstack/react-query';
import { entryApi } from '../api/entry-api';

/** The active consent policy (PRD v2 §5.3) — rarely changes, so cache it generously. */
export function useConsent() {
  return useQuery({
    queryKey: ['entry', 'consent'],
    queryFn: () => entryApi.consent(),
    staleTime: 60 * 60 * 1000,
  });
}
