import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, canAccess, roleFromToken, roleHome } from '@/features/auth/session-config';

/** Route prefixes that require an authenticated session. */
const PROTECTED_PREFIXES = ['/security', '/host', '/admin'];

/**
 * Auth gate (PRD §2). Reads the httpOnly JWT cookie (sent to this origin since
 * the API shares the `localhost` host):
 *  - unauthenticated request to a protected route → redirect to /login
 *  - authenticated request to /login → redirect to the role's dashboard
 *  - wrong role for a section → redirect to the role's own dashboard
 *
 * The cookie presence is the auth signal; role is decoded from the JWT for
 * routing only (the API verifies the token on every request).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = Boolean(token);
  const role = roleFromToken(token);

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
