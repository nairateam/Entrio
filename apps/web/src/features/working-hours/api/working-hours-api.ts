import { MOCK_BLACKOUT_DATES, MOCK_WORKING_HOURS } from '../fixtures';
import type { BlackoutDate, WorkingHour } from '../types';

/**
 * Working-hours data access layer.
 *
 * Seams for the real API. Each mock body becomes a single `apiFetch<T>(...)`:
 *   return apiFetch<WorkingHour[]>('/api/working-hours');
 *   return apiFetch<WorkingHour[]>('/api/working-hours', { method: 'PUT', body: JSON.stringify(hours) });
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let hours: WorkingHour[] = MOCK_WORKING_HOURS.map((h) => ({ ...h }));
let blackouts: BlackoutDate[] = MOCK_BLACKOUT_DATES.map((b) => ({ ...b }));

export async function getWorkingHours(): Promise<WorkingHour[]> {
  await wait();
  return hours.map((h) => ({ ...h }));
}

export async function updateWorkingHours(next: WorkingHour[]): Promise<WorkingHour[]> {
  await wait(400);
  hours = next.map((h) => ({ ...h }));
  return hours.map((h) => ({ ...h }));
}

export async function getBlackoutDates(): Promise<BlackoutDate[]> {
  await wait();
  return blackouts.map((b) => ({ ...b }));
}

export async function addBlackoutDate(input: { date: string; reason: string }): Promise<BlackoutDate> {
  await wait();
  const created: BlackoutDate = { id: `bo-${Date.now()}`, date: input.date, reason: input.reason.trim() };
  blackouts = [...blackouts, created].sort((a, b) => a.date.localeCompare(b.date));
  return { ...created };
}

export async function removeBlackoutDate(id: string): Promise<void> {
  await wait();
  blackouts = blackouts.filter((b) => b.id !== id);
}
