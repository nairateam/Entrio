import { MOCK_OVERRIDE_REQUESTS } from '../fixtures';
import type { OverrideRequest, OverrideStatus } from '../types';

/**
 * Override-request data access layer.
 *
 * Seams for the real API. Each mock body becomes a single `apiFetch<T>(...)`:
 *   return apiFetch<OverrideRequest[]>('/api/overrides?status=pending');
 *   return apiFetch<OverrideRequest>(`/api/overrides/${id}/approve`, { method: 'POST' });
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const RESOLVER = 'Ada Lovelace'; // the acting admin/supervisor (from session later)

let requests: OverrideRequest[] = MOCK_OVERRIDE_REQUESTS.map((r) => ({ ...r }));

export async function getOverrideRequests(): Promise<OverrideRequest[]> {
  await wait();
  return requests.map((r) => ({ ...r }));
}

async function resolve(id: string, status: OverrideStatus): Promise<OverrideRequest> {
  await wait(350);
  const target = requests.find((r) => r.id === id);
  if (!target) throw new Error(`Override ${id} not found`);
  const updated: OverrideRequest = {
    ...target,
    status,
    resolvedByName: RESOLVER,
    resolvedAt: new Date().toISOString(),
  };
  requests = requests.map((r) => (r.id === id ? updated : r));
  return { ...updated };
}

export const approveOverride = (id: string) => resolve(id, 'approved');
export const denyOverride = (id: string) => resolve(id, 'denied');
