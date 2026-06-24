import { MOCK_AUDIT_ENTRIES } from '../fixtures';
import type { AuditEntry, AuditFilters } from '../types';

/**
 * Audit log data access layer.
 *
 * The seam where a real network call will go. Today it filters in-memory
 * fixtures after a simulated round-trip; later the body becomes a single
 * `apiFetch<T>(...)` (the server applies filters + pagination):
 *   return apiFetch<AuditEntry[]>(`/api/audit?${new URLSearchParams(...)}`);
 *
 * The audit log is append-only — there are intentionally no write methods.
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function getAuditLog(filters: AuditFilters): Promise<AuditEntry[]> {
  await wait();
  const q = filters.search.trim().toLowerCase();

  return MOCK_AUDIT_ENTRIES.filter((entry) => {
    if (filters.action !== 'all' && entry.action !== filters.action) return false;

    const date = entry.createdAt.slice(0, 10);
    if (filters.from && date < filters.from) return false;
    if (filters.to && date > filters.to) return false;

    if (q) {
      const haystack =
        `${entry.actorName} ${entry.targetLabel} ${entry.detail ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
