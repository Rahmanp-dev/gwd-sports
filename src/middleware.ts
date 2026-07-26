import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Protected path prefixes that require authentication (Academy Portal)
const PROTECTED = ['/dashboard', '/students', '/attendance', '/fees', '/batches', '/settings', '/content'];

// Super Admin paths — require gwd_super_admin role
const ADMIN = ['/admin'];

// Paths that are explicitly public (no slug conflict)
const RESERVED_PATHS = [
  '/login', '/register', '/about', '/contact', '/gallery', '/events',
  '/privacy-policy', '/terms-and-conditions', '/programs', '/user',
  '/passport', '/rankings', '/not-found', '/mgfc', '/portal'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAdmin = ADMIN.some(p => pathname.startsWith(p));

  // Public routes — no auth needed ( /, /[slug], /passport, /rankings, /events, etc.)
  if (!isProtected && !isAdmin) {
    return NextResponse.next();
  }

  // 1. AUTH CHECK — validate JWT from cookie or Authorization header
  const token =
    req.cookies.get('gwd_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/user/auth', req.url));
  }

  try {
    const secretKey = process.env.JWT_SECRET || 'mastergrade_super_secret_jwt_access_key_2026';
    const secret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, secret);

    // 2. TENANT ISOLATION — inject academy_id, role, user_id into request headers
    const headers = new Headers(req.headers);
    headers.set('x-academy-id', (payload.academy_id as string) || '');
    headers.set('x-user-role', (payload.role as string) || '');
    headers.set('x-user-id', (payload.userId as string) || '');

    // 3. RBAC — /admin routes require admin or gwd_super_admin role
    if (isAdmin && payload.role !== 'gwd_super_admin' && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/user/profile', req.url));
    }

    // 4. Portal routes require an academy assignment (except gwd_super_admin)
    if (isProtected && payload.role !== 'gwd_super_admin' && !payload.academy_id) {
      // User has no academy assigned — redirect to home or show error
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next({ request: { headers } });
  } catch (error) {
    // Token invalid or expired — redirect to auth with cleared session param
    const response = NextResponse.redirect(new URL('/user/auth?clearsession=true', req.url));
    response.cookies.delete('gwd_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|api).*)'],
};
