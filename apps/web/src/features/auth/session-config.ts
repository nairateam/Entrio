import { UserRole } from '@entrio/types';

/**
 * Edge-safe auth constants shared between the middleware (server) and the client.
 * Keep this module free of `document`/DOM and heavy imports so it bundles into
 * the Edge middleware runtime.
 */

/** The httpOnly JWT cookie the API sets on login. */
export const SESSION_COOKIE = 'access_token';

const ROLE_VALUES = Object.values(UserRole) as string[];

/**
 * Read the role from a JWT *without verifying it* — for UX routing only (the API
 * enforces real auth on every request). Edge-safe (`atob`, no Node Buffer).
 */
export function roleFromToken(token: string | undefined): UserRole | undefined {
  const payload = token?.split('.')[1];
  if (!payload) return undefined;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const role = (JSON.parse(json) as { role?: string }).role;
    return role && ROLE_VALUES.includes(role) ? (role as UserRole) : undefined;
  } catch {
    return undefined;
  }
}

const ROLE_HOME: Record<UserRole, string> = {
  [UserRole.SECURITY]: '/security',
  [UserRole.HOST]: '/host',
  [UserRole.ADMIN]: '/admin',
};

/** Landing route for a role after login. */
export function roleHome(role: UserRole | undefined): string {
  return (role && ROLE_HOME[role]) || '/';
}

/**
 * Section-level route authorization (PRD v1.1 §2). Security + Admin share the
 * Security workspace; Host is host-only; the Admin section is admin-only.
 */
const SECTION_ACCESS: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: '/security', roles: [UserRole.SECURITY, UserRole.ADMIN] },
  { prefix: '/host', roles: [UserRole.HOST, UserRole.ADMIN] },
  { prefix: '/admin', roles: [UserRole.ADMIN] },
];

/** Whether a role may access a pathname. Non-section routes are unrestricted. */
export function canAccess(role: UserRole | undefined, pathname: string): boolean {
  const section = SECTION_ACCESS.find(
    (s) => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`),
  );
  if (!section) return true;
  return Boolean(role && section.roles.includes(role));
}
