import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@entrio/types';
import { SESSION_COOKIE, canAccess, roleHome } from '@/features/auth/session-config';

/** Route prefixes that require an authenticated session. */
const PROTECTED_PREFIXES = ['/security', '/host', '/admin'];

/**
 * Auth gate (PRD §2). Reads the session cookie:
 *  - unauthenticated request to a protected route → redirect to /login
 *  - authenticated request to /login → redirect to the role's dashboard
 *
 * Presence of the cookie is the auth signal; this stays correct when the backend
 * swaps in an httpOnly JWT cookie (full validation still happens in the API).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = Boolean(raw);

  let role: UserRole | undefined;
  if (raw) {
    try {
      role = (JSON.parse(decodeURIComponent(raw)) as { role?: UserRole }).role;
    } catch {
      role = undefined;
    }
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated but wrong role for this section → send to their own dashboard.
  if (isProtected && authed && !canAccess(role, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(role);
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && authed) {
    const url = req.nextUrl.clone();
    url.pathname = roleHome(role);
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/security/:path*', '/host/:path*', '/admin/:path*', '/login'],
};
