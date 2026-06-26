import { apiFetch } from '@/lib/api/client';
import type { CreatedDevice, Device } from '../types';

export function getDevices(): Promise<Device[]> {
  return apiFetch<Device[]>('/api/devices');
}

export function createDevice(label: string): Promise<CreatedDevice> {
  return apiFetch<CreatedDevice>('/api/devices', {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
}

export function revokeDevice(id: string): Promise<Device> {
  return apiFetch<Device>(`/api/devices/${id}`, { method: 'DELETE' });
}
