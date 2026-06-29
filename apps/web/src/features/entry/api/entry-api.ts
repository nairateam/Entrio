import { entryFetch } from './entry-client';
import type {
  ActiveLookup,
  CheckInInput,
  CheckInResult,
  ConsentPolicy,
  EntryActiveVisit,
  PreRegLookup,
} from '../types';

export const entryApi = {
  consent: () => entryFetch<ConsentPolicy>('/api/self-service/consent'),

  // check-in
  /** Validate a pre-registration code (returns host/purpose only — no id/PII). */
  lookupByCode: (code: string) =>
    entryFetch<PreRegLookup>(`/api/self-service/visits/by-code/${encodeURIComponent(code)}`),
  checkIn: (input: CheckInInput) =>
    entryFetch<CheckInResult>('/api/self-service/check-in', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // check-out
  /** Today's checked-in roster (fetched then filtered client-side). No ids/photos. */
  listActive: () => entryFetch<EntryActiveVisit[]>('/api/self-service/checkout/active'),
  /** Validate an active code for check-out (returns name/host only — no id/PII). */
  lookupActiveByCode: (code: string) =>
    entryFetch<ActiveLookup>(`/api/self-service/checkout/by-code/${encodeURIComponent(code)}`),
  /** Check out by the visitor's own code — the server resolves the visit. */
  checkOut: (entryCode: string) =>
    entryFetch<unknown>('/api/self-service/check-out', {
      method: 'POST',
      body: JSON.stringify({ entryCode }),
    }),
};
