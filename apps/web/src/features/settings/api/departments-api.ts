import { apiFetch } from '@/lib/api/client';
import type { Department } from '../types';

/** Department pick-list data access layer (admin). */

export function getDepartments(): Promise<Department[]> {
  return apiFetch<Department[]>('/api/departments');
}

export function createDepartment(name: string): Promise<Department> {
  return apiFetch<Department>('/api/departments', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function removeDepartment(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/api/departments/${id}`, { method: 'DELETE' });
}
