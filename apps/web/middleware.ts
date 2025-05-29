import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GATE_COOKIE = 'chti_access';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the gate page and static/API assets
  if (pathname === '/gate' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (request.cookies.get(GATE_COOKIE)?.value === 'granted') {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/gate', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
