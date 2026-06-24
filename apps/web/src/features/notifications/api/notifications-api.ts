import { apiFetch } from '@/lib/api/client';
import type { NotificationItem } from '../types';

/** Notifications data access layer (PRD §3). */

export function getNotifications(): Promise<NotificationItem[]> {
  return apiFetch<NotificationItem[]>('/api/notifications');
}

export function markRead(id: string): Promise<void> {
  return apiFetch<void>(`/api/notifications/${id}/read`, { method: 'POST' });
}

export function markAllRead(): Promise<void> {
  return apiFetch<void>('/api/notifications/read-all', { method: 'POST' });
}
