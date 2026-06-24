import type { User } from '@entrio/types';
import { MOCK_USERS } from '../fixtures';
import type { InviteInput } from '../schema';

/**
 * User-management data access layer.
 *
 * Seams for the real API. Each mock body becomes a single `apiFetch<T>(...)`:
 *   return apiFetch<User[]>('/api/users');
 *   return apiFetch<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
 *   return apiFetch<User>('/api/users', { method: 'POST', body: JSON.stringify(input) });
 */

const SIMULATED_LATENCY_MS = 300;
const wait = (ms = SIMULATED_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let users: User[] = MOCK_USERS.map((u) => ({ ...u }));

export async function getUsers(): Promise<User[]> {
  await wait();
  return users.map((u) => ({ ...u }));
}

export async function setUserActive(id: string, isActive: boolean): Promise<User> {
  await wait(200);
  const target = users.find((u) => u.id === id);
  if (!target) throw new Error(`User ${id} not found`);
  const updated = { ...target, isActive, updatedAt: new Date().toISOString() };
  users = users.map((u) => (u.id === id ? updated : u));
  return { ...updated };
}

export async function inviteUser(input: InviteInput): Promise<User> {
  await wait(400);
  const now = new Date().toISOString();
  const created: User = {
    id: `user-${Date.now()}`,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: null,
    role: input.role,
    department: input.department?.trim() || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  users = [created, ...users];
  return { ...created };
}
