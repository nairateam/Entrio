import type { VisitStatus } from '@entrio/types';

/**
 * Denormalized visit as seen on a host's own dashboard (PRD §4.4 / §4.5).
 * `hostOnWay` reflects the host having tapped "On My Way" after an arrival.
 */
export interface HostVisit {
  id: string;
  hostId: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string | null;
  photoUrl: string | null;
  purpose: string | null;
  status: VisitStatus;
  expectedTime: string | null;
  checkInTime: string | null;
  hostOnWay: boolean;
  /** Typed entry code the visitor uses at the self-service device (PRD v2 §3.2). */
  entryCode: string | null;
}

/**
 * A host's personal "do not send this visitor to me" entry (PRD §4.11). The
 * reason is private to the host and Admin; it is never a building-wide block.
 */
export interface HostRestriction {
  id: string;
  hostId: string;
  visitorName: string;
  visitorPhone: string;
  reason: string;
  createdAt: string;
  isActive: boolean;
}
