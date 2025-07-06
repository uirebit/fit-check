import { NextRequest, NextResponse } from "next/server";

// Paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/sizes',
  '/settings',
  '/account'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a protected path (case-insensitive)
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    pathname.toLowerCase().includes(path.toLowerCase())
  );
  
  if (!isProtectedPath) {
    return NextResponse.next();
  }
  
  // Check if user is authenticated
  const token = request.cookies.get("auth_token")?.value;
  const hasSessionCookie = request.cookies.get("user_session")?.value;
  
  // For middleware, we can only check cookies, not localStorage
  // Client-side code in the dashboard will handle the localStorage check
  
  if (!token && !hasSessionCookie) {
    // Extract locale from URL
    const locale = pathname.split('/')[1] || 'en';
    
    // Redirect to login page with the same locale
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Apply this middleware to dashboard and related paths only
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
