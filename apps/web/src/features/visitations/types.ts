import type { VisitStatus } from '@entrio/types';

/** A single visitation (visit) row in the visitations log. */
export interface Visitation {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorPhone: string;
  photoUrl: string | null;
  hostName: string;
  purpose: string | null;
  status: VisitStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedTime: string | null;
  hostResponse: string | null;
}
