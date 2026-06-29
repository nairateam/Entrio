import type { VisitStatus } from '@entrio/types';

/**
 * Denormalized "today's board" row. The board endpoint joins a visit with its
 * visitor and host so the table can render without extra lookups — this is the
 * shape the API will return (see ./api/live-board-api.ts).
 */
export interface BoardVisit {
  id: string;
  /** Null for self-service walk-ins, which keep no Visitor record (PRD v2). */
  visitorId: string | null;
  visitorName: string;
  visitorPhone: string;
  photoUrl: string | null;
  /** Null until the front desk assigns a host (self-service walk-ins). */
  hostName: string | null;
  /** The host the walk-in visitor typed, pending assignment. */
  requestedHostName: string | null;
  purpose: string | null;
  status: VisitStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedTime: string | null;
  /** The host's latest reply to the front desk about this visit, if any. */
  hostResponse: string | null;
}

/** Status filter for the full board; 'all' shows everything. */
export type StatusFilter = VisitStatus | 'all';

/** Board view mode: the full day's table, or the evacuation roll call. */
export type BoardView = 'today' | 'inside';
