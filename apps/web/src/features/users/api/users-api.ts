import type { Paginated, User } from '@entrio/types';
import { apiFetch } from '@/lib/api/client';
import type { InviteInput } from '../schema';

/** User-management data access layer (admin). */

export interface UsersQuery {
  search: string;
  role: string;
  page: number;
  pageSize: number;
}

export function getUsers(q: UsersQuery): Promise<Paginated<User>> {
  const params = new URLSearchParams({ page: String(q.page), pageSize: String(q.pageSize) });
  if (q.search) params.set('search', q.search);
  if (q.role && q.role !== 'all') params.set('role', q.role);
  return apiFetch<Paginated<User>>(`/api/users?${params.toString()}`);
}

export function setUserActive(id: string, isActive: boolean): Promise<User> {
  return apiFetch<User>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function inviteUser(input: InviteInput): Promise<User> {
  return apiFetch<User>('/api/users', { method: 'POST', body: JSON.stringify(input) });
}

export interface BulkInviteResult {
  created: User[];
  failed: Array<{ index: number; email: string; reason: string }>;
  total: number;
}

/** Invite many users at once (CSV upload). Returns per-row results. */
export function bulkInviteUsers(users: InviteInput[]): Promise<BulkInviteResult> {
  return apiFetch<BulkInviteResult>('/api/users/bulk', {
    method: 'POST',
    body: JSON.stringify({ users }),
  });
}

/** Admin-managed department options for the invite form's dropdown. */
export function getDepartmentOptions(): Promise<Array<{ id: string; name: string }>> {
  return apiFetch<Array<{ id: string; name: string }>>('/api/departments');
}
