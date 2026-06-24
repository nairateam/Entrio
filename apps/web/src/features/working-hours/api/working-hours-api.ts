import { apiFetch } from '@/lib/api/client';
import type { BlackoutDate, WorkingHour } from '../types';

/** Working-hours data access layer (PRD §3 / §4.8). */

export function getWorkingHours(): Promise<WorkingHour[]> {
  return apiFetch<WorkingHour[]>('/api/working-hours');
}

/** The API upserts per day, so save each day and return the updated set. */
export async function updateWorkingHours(next: WorkingHour[]): Promise<WorkingHour[]> {
  const saved = await Promise.all(
    next.map((h) =>
      apiFetch<WorkingHour>(`/api/working-hours/${h.dayOfWeek}`, {
        method: 'PUT',
        body: JSON.stringify({ openTime: h.openTime, closeTime: h.closeTime, isActive: h.isActive }),
      }),
    ),
  );
  return saved.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

export function getBlackoutDates(): Promise<BlackoutDate[]> {
  return apiFetch<BlackoutDate[]>('/api/working-hours/blackouts');
}

export function addBlackoutDate(input: { date: string; reason: string }): Promise<BlackoutDate> {
  return apiFetch<BlackoutDate>('/api/working-hours/blackouts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function removeBlackoutDate(id: string): Promise<void> {
  return apiFetch<void>(`/api/working-hours/blackouts/${id}`, { method: 'DELETE' });
}
