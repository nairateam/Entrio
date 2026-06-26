import { kioskFetch } from './kiosk-client';
import type {
  CheckInInput,
  CheckInResult,
  ConsentPolicy,
  KioskActiveVisit,
  KioskHost,
  KioskVisit,
  KioskVisitorMatch,
} from '../types';

const qs = (q: string) => `?q=${encodeURIComponent(q)}`;

export const kioskApi = {
  consent: () => kioskFetch<ConsentPolicy>('/api/self-service/consent'),

  // check-in
  searchVisitors: (q: string) =>
    kioskFetch<KioskVisitorMatch[]>(`/api/self-service/visitors/search${qs(q)}`),
  searchHosts: (q: string) => kioskFetch<KioskHost[]>(`/api/self-service/hosts/search${qs(q)}`),
  /** Full active-host directory (fetched once, filtered client-side). */
  listHosts: () => kioskFetch<KioskHost[]>('/api/self-service/hosts/search'),
  lookupByCode: (code: string) =>
    kioskFetch<KioskVisit>(`/api/self-service/visits/by-code/${encodeURIComponent(code)}`),
  checkIn: (input: CheckInInput) =>
    kioskFetch<CheckInResult>('/api/self-service/check-in', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // check-out
  /** Everyone currently checked in (fetched then filtered client-side). */
  listActive: () => kioskFetch<KioskActiveVisit[]>('/api/self-service/checkout/active'),
  lookupActiveByCode: (code: string) =>
    kioskFetch<KioskVisit>(`/api/self-service/checkout/by-code/${encodeURIComponent(code)}`),
  checkOut: (visitId: string) =>
    kioskFetch<KioskVisit>('/api/self-service/check-out', {
      method: 'POST',
      body: JSON.stringify({ visitId }),
    }),
};
