import { entryFetch } from './entry-client';
import type {
  CheckInInput,
  CheckInResult,
  ConsentPolicy,
  EntryActiveVisit,
  EntryHost,
  EntryVisit,
} from '../types';

const qs = (q: string) => `?q=${encodeURIComponent(q)}`;

export const entryApi = {
  consent: () => entryFetch<ConsentPolicy>('/api/self-service/consent'),

  // check-in
  searchHosts: (q: string) => entryFetch<EntryHost[]>(`/api/self-service/hosts/search${qs(q)}`),
  /** Full active-host directory (fetched once, filtered client-side). */
  listHosts: () => entryFetch<EntryHost[]>('/api/self-service/hosts/search'),
  lookupByCode: (code: string) =>
    entryFetch<EntryVisit>(`/api/self-service/visits/by-code/${encodeURIComponent(code)}`),
  checkIn: (input: CheckInInput) =>
    entryFetch<CheckInResult>('/api/self-service/check-in', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // check-out
  /** Everyone currently checked in (fetched then filtered client-side). */
  listActive: () => entryFetch<EntryActiveVisit[]>('/api/self-service/checkout/active'),
  lookupActiveByCode: (code: string) =>
    entryFetch<EntryVisit>(`/api/self-service/checkout/by-code/${encodeURIComponent(code)}`),
  checkOut: (visitId: string) =>
    entryFetch<EntryVisit>('/api/self-service/check-out', {
      method: 'POST',
      body: JSON.stringify({ visitId }),
    }),
};
