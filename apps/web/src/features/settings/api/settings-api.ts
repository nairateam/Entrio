import type { SystemSettings } from '../types';

/**
 * Settings data access layer.
 *
 * Seams for the real API. Each mock body becomes a single `apiFetch<T>(...)`:
 *   return apiFetch<SystemSettings>('/api/settings');
 *   return apiFetch<SystemSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(next) });
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let settings: SystemSettings = {
  overstayThresholdHours: 4,
  smsNotifications: true,
  emailNotifications: true,
};

export async function getSettings(): Promise<SystemSettings> {
  await wait();
  return { ...settings };
}

export async function updateSettings(next: SystemSettings): Promise<SystemSettings> {
  await wait(400);
  settings = { ...next };
  return { ...settings };
}
