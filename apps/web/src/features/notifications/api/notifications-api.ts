import { MOCK_NOTIFICATIONS } from '../fixtures';
import type { NotificationItem } from '../types';

/**
 * Notifications data access layer.
 *
 * Seams for the real API. Each mock body becomes a single `apiFetch<T>(...)`:
 *   return apiFetch<NotificationItem[]>('/api/notifications');
 *   return apiFetch<void>(`/api/notifications/${id}/read`, { method: 'POST' });
 *   return apiFetch<void>('/api/notifications/read-all', { method: 'POST' });
 *
 * Real-time delivery (PRD §5) would layer a websocket on top of this.
 */

const SIMULATED_LATENCY_MS = 250;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let items: NotificationItem[] = MOCK_NOTIFICATIONS.map((n) => ({ ...n }));

export async function getNotifications(): Promise<NotificationItem[]> {
  await wait();
  return items.map((n) => ({ ...n }));
}

export async function markRead(id: string): Promise<void> {
  await wait(120);
  items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
}

export async function markAllRead(): Promise<void> {
  await wait(120);
  items = items.map((n) => ({ ...n, read: true }));
}
