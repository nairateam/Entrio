import { UserRole } from '@entrio/types';

/**
 * Edge-safe auth constants shared between the middleware (server) and the client
 * session helpers. Keep this module free of `document`/DOM and heavy imports so
 * it can be bundled into the Edge middleware runtime.
 */

/** Session cookie name. When the backend auth module lands this becomes the
 *  httpOnly cookie the API sets; the middleware check below stays the same. */
export const SESSION_COOKIE = 'entrio_session';

const ROLE_HOME: Record<UserRole, string> = {
  [UserRole.SECURITY]: '/security',
  [UserRole.HOST]: '/host',
  [UserRole.ADMIN]: '/admin',
  [UserRole.SUPER_ADMIN]: '/admin',
  [UserRole.SUPERVISOR]: '/admin',
};

/** Landing route for a role after login. */
export function roleHome(role: UserRole | undefined): string {
  return (role && ROLE_HOME[role]) || '/';
}

/**
 * Section-level route authorization (PRD §2). Front-desk operators, supervisors
 * and admins share the Security workspace; Host is host-only; the Admin section
 * is for admins and supervisors. Finer per-page rules (e.g. supervisor not
 * seeing Reports) are reflected in the nav and enforced server-side per request.
 */
const SECTION_ACCESS: Array<{ prefix: string; roles: UserRole[] }> = [
  {
    prefix: '/security',
    roles: [UserRole.SECURITY, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  },
  { prefix: '/host', roles: [UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { prefix: '/admin', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPERVISOR] },
];

/** Whether a role may access a pathname. Non-section routes are unrestricted. */
export function canAccess(role: UserRole | undefined, pathname: string): boolean {
  const section = SECTION_ACCESS.find(
    (s) => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`),
  );
  if (!section) return true;
  return Boolean(role && section.roles.includes(role));
}
