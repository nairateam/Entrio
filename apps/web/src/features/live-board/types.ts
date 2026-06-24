import type { VisitStatus } from '@entrio/types';

/**
 * Denormalized "today's board" row. The board endpoint joins a visit with its
 * visitor and host so the table can render without extra lookups — this is the
 * shape the API will return (see ./api/live-board-api.ts).
 */
export interface BoardVisit {
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
  /** The host's latest reply to the front desk about this visit, if any. */
  hostResponse: string | null;
}

/** Status filter for the full board; 'all' shows everything. */
export type StatusFilter = VisitStatus | 'all';

/** Board view mode: the full day's table, or the evacuation roll call. */
export type BoardView = 'today' | 'inside';
