import { MOCK_ADMIN_VISITORS } from '../fixtures';
import type { AdminVisitor } from '../types';

/**
 * Blocklist / flag data access layer.
 *
 * Each function is the seam where a real network call will go. Today it mutates
 * an in-memory working copy after a simulated round-trip; later each body becomes
 * a single `apiFetch<T>(...)` call against apps/api — and the server writes the
 * accompanying audit_logs entry (PRD §4.7 / §4.12). Signatures are final.
 *
 * Example:
 *   return apiFetch<AdminVisitor>(`/api/visitors/${id}/block`, {
 *     method: 'POST', body: JSON.stringify({ reason }),
 *   });
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// The acting admin — comes from the session once auth is wired.
const ACTING_ADMIN = 'Ada Lovelace';

let visitors: AdminVisitor[] = MOCK_ADMIN_VISITORS.map((v) => ({ ...v }));

function update(id: string, patch: Partial<AdminVisitor>): AdminVisitor {
  const target = visitors.find((v) => v.id === id);
  if (!target) throw new Error(`Visitor ${id} not found`);
  const updated = { ...target, ...patch };
  visitors = visitors.map((v) => (v.id === id ? updated : v));
  return { ...updated };
}

export async function getBlockedVisitors(): Promise<AdminVisitor[]> {
  await wait();
  return visitors.filter((v) => v.isBlocked).map((v) => ({ ...v }));
}

export async function getFlaggedVisitors(): Promise<AdminVisitor[]> {
  await wait();
  return visitors.filter((v) => v.isFlagged).map((v) => ({ ...v }));
}

/** Block a visitor building-wide (PRD §4.7). Escalating a flag also clears it. */
export async function blockVisitor(id: string, reason: string): Promise<AdminVisitor> {
  await wait(400);
  return update(id, {
    isBlocked: true,
    blockReason: reason.trim(),
    blockedByName: ACTING_ADMIN,
    blockedAt: new Date().toISOString(),
    isFlagged: false,
    flagNote: null,
    flaggedByName: null,
    flaggedAt: null,
  });
}

/** Remove a building-wide block (PRD §4.12). */
export async function unblockVisitor(id: string): Promise<AdminVisitor> {
  await wait();
  return update(id, {
    isBlocked: false,
    blockReason: null,
    blockedByName: null,
    blockedAt: null,
  });
}

/** Resolve a flag without blocking (PRD §4.12). */
export async function clearFlag(id: string): Promise<AdminVisitor> {
  await wait();
  return update(id, {
    isFlagged: false,
    flagNote: null,
    flaggedByName: null,
    flaggedAt: null,
  });
}
