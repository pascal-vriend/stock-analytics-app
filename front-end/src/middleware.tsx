// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/profile', '/settings'];
const LOGIN_PATH = '/login';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    const isProtectedRoute = PROTECTED_PATHS.some(path => pathname.startsWith(path));

    if (refreshToken && pathname === LOGIN_PATH) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    if (isProtectedRoute && !refreshToken) {

        return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};