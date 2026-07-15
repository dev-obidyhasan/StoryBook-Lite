import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authRoutes = ['/login'];
const privateRoutes = ['/orders', '/templates', '/settings'];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const hasRefreshedQuery = searchParams.has('__refreshed');

  // ── Protect all private routes ───────────────────────────────────
  if (privateRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (!accessToken) {
      const refreshToken = request.cookies.get('refreshToken')?.value;

      // Only attempt refresh if we have a refresh token and haven't tried already in this request chain
      if (refreshToken && !hasRefreshedQuery) {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Cookie': `refreshToken=${refreshToken}`,
            },
          });

          if (refreshRes.ok) {
            const json = await refreshRes.json();
            const newToken = json?.data?.accessToken;
            if (newToken) {
              // Successfully refreshed! Redirect to the same URL with '__refreshed=1'
              // to ensure the browser saves and sends the cookie on the next request.
              const url = new URL(request.url);
              url.searchParams.set('__refreshed', '1');

              const response = NextResponse.redirect(url);
              response.cookies.set('accessToken', newToken, {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
                sameSite: 'lax',
              });
              return response;
            }
          }
        } catch (e) {
          console.error('Server-side token refresh error in proxy:', e);
        }
      }

      // If we don't have a refresh token, or the refresh attempt failed, redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      return response;
    }
  }

  // ── Redirect authenticated users away from login page ────────────
  if (accessToken && authRoutes.some((route) => pathname.startsWith(route))) {
    const url = new URL('/orders', request.url);
    url.searchParams.delete('__refreshed');
    return NextResponse.redirect(url);
  }

  // ── Redirect root to orders or login ─────────────────────────────
  if (pathname === '/') {
    const url = new URL(accessToken ? '/orders' : '/login', request.url);
    url.searchParams.delete('__refreshed');
    return NextResponse.redirect(url);
  }

  // ── Clean up __refreshed query parameter if it exists on successful load ──
  if (accessToken && hasRefreshedQuery) {
    const url = new URL(request.url);
    url.searchParams.delete('__refreshed');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/orders/:path*', '/templates/:path*', '/settings/:path*', '/login'],
};
