import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect admin API routes (allow GET for public catalog access + cart-quote POST)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/search') && !pathname.startsWith('/api/contact') && !pathname.startsWith('/api/cart-quote')) {
    const method = request.method;
    // Allow GET requests for public catalog browsing (products, categories)
    if (method !== 'GET') {
      const token = request.cookies.get('admin_token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/products/:path*', '/api/categories/:path*', '/api/banners/:path*', '/api/import/:path*', '/api/settings/:path*', '/api/seo/:path*', '/api/pricing/:path*'],
};
