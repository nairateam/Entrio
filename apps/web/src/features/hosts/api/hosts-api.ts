import { VisitStatus } from '@entrio/types';
import { MOCK_CURRENT_HOST, MOCK_HOST_RESTRICTIONS, MOCK_HOST_VISITS } from '../fixtures';
import type { PreRegisterInput, RestrictionInput } from '../schema';
import type { HostRestriction, HostVisit } from '../types';

/**
 * Hosts data access layer.
 *
 * Each function is the seam where a real network call will go. Today it resolves
 * against in-memory fixtures after a simulated round-trip; later each body
 * becomes a single `apiFetch<T>(...)` call against apps/api — signatures and
 * return types are final, so callers won't change.
 *
 * Example of the eventual implementation:
 *   return apiFetch<HostVisit[]>(`/api/hosts/${hostId}/visits`);
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Mutable working copy so pre-registration and "On My Way" persist in-session.
let visits: HostVisit[] = MOCK_HOST_VISITS.map((v) => ({ ...v }));

/** The host's own visits, upcoming and recent (PRD §4.4 / §4.5). */
export async function getHostVisits(hostId: string): Promise<HostVisit[]> {
  await wait();
  return visits.filter((v) => v.hostId === hostId).map((v) => ({ ...v }));
}

/**
 * Pre-register a visitor (PRD §4.4): creates a visit with status `expected`.
 * Combines the form's date + time into a single expected timestamp.
 */
export async function preRegisterVisit(
  hostId: string,
  input: PreRegisterInput,
): Promise<HostVisit> {
  await wait(450);
  const expectedTime = new Date(`${input.expectedDate}T${input.expectedTime}`).toISOString();
  const visit: HostVisit = {
    id: `hv-${Date.now()}`,
    hostId,
    visitorName: input.visitorName.trim(),
    visitorPhone: input.visitorPhone.trim(),
    visitorEmail: input.visitorEmail?.trim() || null,
    photoUrl: null,
    purpose: input.purpose?.trim() || null,
    status: VisitStatus.EXPECTED,
    expectedTime,
    checkInTime: null,
    hostOnWay: false,
  };
  visits = [visit, ...visits];
  return { ...visit };
}

/**
 * Host taps "On My Way" after an arrival (PRD §4.5) — flags the visit so
 * Security sees it on the live board. Returns the updated visit.
 */
export async function markOnMyWay(visitId: string): Promise<HostVisit> {
  await wait(250);
  const target = visits.find((v) => v.id === visitId);
  if (!target) throw new Error(`Visit ${visitId} not found`);
  const updated: HostVisit = { ...target, hostOnWay: true };
  visits = visits.map((v) => (v.id === visitId ? updated : v));
  return { ...updated };
}

// --- Host-level visitor restrictions (PRD §4.11) ---------------------------

let restrictions: HostRestriction[] = MOCK_HOST_RESTRICTIONS.map((r) => ({ ...r }));

export async function getRestrictions(hostId: string): Promise<HostRestriction[]> {
  await wait();
  return restrictions.filter((r) => r.hostId === hostId && r.isActive).map((r) => ({ ...r }));
}

export async function addRestriction(
  hostId: string,
  input: RestrictionInput,
): Promise<HostRestriction> {
  await wait();
  const created: HostRestriction = {
    id: `hr-${Date.now()}`,
    hostId,
    visitorName: input.visitorName.trim(),
    visitorPhone: input.visitorPhone.trim(),
    reason: input.reason.trim(),
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  restrictions = [created, ...restrictions];
  return { ...created };
}

/** Lift a restriction (sets is_active = false — PRD §4.11). */
export async function liftRestriction(id: string): Promise<void> {
  await wait();
  restrictions = restrictions.map((r) => (r.id === id ? { ...r, isActive: false } : r));
}

export { MOCK_CURRENT_HOST };
