import { VisitStatus } from '@entrio/types';
import { MOCK_BOARD_VISITS } from '../fixtures';
import type { BoardVisit } from '../types';

/**
 * Live-board data access layer.
 *
 * Each function is the seam where a real network call will go. Today it resolves
 * against in-memory fixtures after a simulated round-trip; later each body
 * becomes a single `apiFetch<T>(...)` call against apps/api — signatures and
 * return types are final, so callers won't change.
 *
 * Example of the eventual implementation:
 *   return apiFetch<BoardVisit[]>('/api/visits/today');
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A mutable working copy so check-out persists within the session.
let board: BoardVisit[] = MOCK_BOARD_VISITS.map((v) => ({ ...v }));

/** Today's visits across all statuses (PRD §4.3 board / §4.10 roll call). */
export async function getTodayVisits(): Promise<BoardVisit[]> {
  await wait();
  return board.map((v) => ({ ...v }));
}

/**
 * Check a visitor out (PRD §4.3): log check-out time, set status checked_out.
 * Returns the updated row.
 */
export async function checkOutVisit(visitId: string): Promise<BoardVisit> {
  await wait();
  const target = board.find((v) => v.id === visitId);
  if (!target) {
    throw new Error(`Visit ${visitId} not found`);
  }
  const updated: BoardVisit = {
    ...target,
    status: VisitStatus.CHECKED_OUT,
    checkOutTime: new Date().toISOString(),
  };
  board = board.map((v) => (v.id === visitId ? updated : v));
  return { ...updated };
}

/**
 * Flag a visitor for review (PRD §4.12). A flag escalates to a supervisor/admin
 * with a note; it does not deny entry. Real impl writes the flag + an audit
 * entry: apiFetch(`/api/visitors/${visitorId}/flag`, { method: 'POST', body }).
 */
export async function flagVisit(visitId: string, note: string): Promise<void> {
  await wait();
  void visitId;
  void note;
}
