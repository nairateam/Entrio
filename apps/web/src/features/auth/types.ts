import type { User } from '@entrio/types';

/**
 * Shape returned by the login endpoint. The JWT itself is set as an httpOnly
 * cookie by the API (PRD §5 / auth module), so it is intentionally not part of
 * this client-facing payload — only the authenticated user is returned.
 */
export interface LoginResult {
  user: User;
}

export type { User };
