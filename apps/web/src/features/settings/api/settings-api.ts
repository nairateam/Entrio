import { apiFetch } from '@/lib/api/client';
import type { SystemSettings } from '../types';

/** Settings data access layer (PRD §4.6 overstay threshold + channels). */

export function getSettings(): Promise<SystemSettings> {
  return apiFetch<SystemSettings>('/api/settings');
}

export function updateSettings(next: SystemSettings): Promise<SystemSettings> {
  return apiFetch<SystemSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(next) });
}
