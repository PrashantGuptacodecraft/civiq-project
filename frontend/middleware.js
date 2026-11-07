/**
 * CivIQ Next.js Route Protection Middleware
 *
 * Runs on the Edge runtime before every request.
 * - Public routes: /, /report, /map, /incidents, /login, /register
 * - Protected routes: gated by role stored in localStorage-backed cookie
 *
 * Since we use localStorage for the token (not httpOnly cookies), this
 * middleware only checks for a lightweight "civiq_role" cookie that the
 * frontend sets alongside the token.  The authoritative check always
 * happens server-side in the Express API; this is a UX guard only.
 */

import { NextResponse } from 'next/server';

// Routes that any visitor can access without login
const PUBLIC_PATHS = ['/', '/report', '/map', '/incidents', '/login', '/register', '/disaster-reporting'];

// Role groups for protected routes
const ROUTE_ROLES = {
  '/dashboard':     ['PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ULB_ADMIN', 'DEPARTMENT_OFFICER'],
  '/analytics':     ['PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ULB_ADMIN', 'DEPARTMENT_OFFICER', 'AUDITOR'],
  '/assets':        ['PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ULB_ADMIN', 'DEPARTMENT_OFFICER'],
  '/verification':  ['PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ULB_ADMIN', 'VERIFICATION_OFFICER'],
  '/field':         ['FIELD_WORKER', 'FIELD_SUPERVISOR', 'DISTRICT_ULB_ADMIN', 'PLATFORM_SUPER_ADMIN'],
  '/situation-room':['DISASTER_COORDINATOR', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'PLATFORM_SUPER_ADMIN'],
  '/resolution-review': ['PLATFORM_SUPER_ADMIN', 'NATIONAL_ADMIN', 'STATE_ADMIN', 'DISTRICT_ULB_ADMIN', 'DEPARTMENT_OFFICER', 'AUDITOR'],
};

function isPublic(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Allow any path starting with a public prefix (e.g., /incidents/123)
  for (const p of PUBLIC_PATHS) {
    if (p !== '/' && pathname.startsWith(p + '/')) return true;
  }
  // Always allow Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/api')) return true;
  return false;
}

function getRequiredRoles(pathname) {
  for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
    if (pathname === route || pathname.startsWith(route + '/')) return roles;
  }
  return null; // no restriction
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const requiredRoles = getRequiredRoles(pathname);
  if (!requiredRoles) return NextResponse.next(); // unknown route — allow

  // Read role from lightweight cookie set by AuthProvider
  const roleCookie = request.cookies.get('civiq_role')?.value;

  if (!roleCookie) {
    // Not logged in — redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!requiredRoles.includes(roleCookie)) {
    // Logged in but wrong role — redirect home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internal)
     * - favicon.ico
     * - api routes (Express handles their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
