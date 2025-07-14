import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt";

const PUBLIC_LOCALES = ["en", "es", "pt"]
const DEFAULT_LOCALE = "en"

// Paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/sizes',
  '/settings',
  '/account',
  '/admin',
  '/onboarding'
];

// Admin paths that require admin privileges
const ADMIN_PATHS = [
  '/admin'
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Check if this is a protected path (case-insensitive)
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    // Make sure we check for the path after the locale
    pathname.replace(/^\/[a-z]{2}/, '').startsWith(path)
  );
  
  if (isProtectedPath) {
    // Get locale from URL (for redirect purposes)
    const locale = pathname.split('/')[1];
    const isValidLocale = PUBLIC_LOCALES.includes(locale);
    const redirectLocale = isValidLocale ? locale : DEFAULT_LOCALE;
    
    // Check NextAuth session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "your-default-secret-do-not-use-in-production"
    });
    
    if (!token) {
      // No session found, redirect to login page with the same locale (root page with auth form)
      return NextResponse.redirect(new URL(`/${redirectLocale}`, request.url));
    }
    
    // Check if user needs onboarding (except for superadmins and if already on onboarding page)
    const isOnboardingPath = pathname.replace(/^\/[a-z]{2}/, '').startsWith('/onboarding');
    const companyId = token.companyId as string | null | undefined;
    const gender = token.gender as string | null | undefined;
    const isSuperadmin = token.isSuperadmin as boolean | undefined;
    
    // Check if onboarding was just completed (indicated by query parameter)
    const onboardingCompleted = searchParams.get('onboarding-completed') === 'true';
    
    // Debug logging
    console.log('Middleware check:', {
      pathname,
      isOnboardingPath,
      companyId,
      gender,
      isSuperadmin,
      onboardingCompleted,
      needsOnboarding: !companyId || !gender
    });
    
    // If onboarding was just completed, allow access to dashboard even if token isn't updated yet
    if (onboardingCompleted && pathname.replace(/^\/[a-z]{2}/, '').startsWith('/dashboard')) {
      console.log('Allowing dashboard access after onboarding completion');
      return NextResponse.next();
    }
    
    // Redirect to onboarding if user doesn't have companyId or gender (unless they're superadmin or already on onboarding)
    if (!isSuperadmin && !isOnboardingPath && (!companyId || !gender)) {
      console.log('Redirecting to onboarding');
      return NextResponse.redirect(new URL(`/${redirectLocale}/onboarding`, request.url));
    }
    
    // If user is on onboarding page but already has complete data, redirect to dashboard
    if (isOnboardingPath && companyId && gender) {
      console.log('Redirecting to dashboard from onboarding');
      return NextResponse.redirect(new URL(`/${redirectLocale}/dashboard`, request.url));
    }
    
    // Check for admin paths
    const isAdminPath = ADMIN_PATHS.some(path => 
      pathname.replace(/^\/[a-z]{2}/, '').startsWith(path)
    );
    
    if (isAdminPath) {
      // Check if user has admin privileges
      const userType = token.userType as number | undefined;
      const isAdmin = token.isAdmin as boolean | undefined;
      const isSuperadmin = token.isSuperadmin as boolean | undefined;
      
      // Admin access is granted to userType 1 (superadmin) or 2 (admin), or if isAdmin/isSuperadmin flags are true
      if (!(userType === 1 || userType === 2 || isAdmin === true || isSuperadmin === true)) {
        // User doesn't have admin privileges, redirect to dashboard
        return NextResponse.redirect(new URL(`/${redirectLocale}/dashboard`, request.url));
      }
    }
  }
  
  // Locale redirection (only if not already localized)
  if (!PUBLIC_LOCALES.some((locale) => pathname.startsWith(`/${locale}`))) {
    // Check for language cookie first
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
    
    // Then check browser language if no cookie
    const acceptLang = request.headers.get("accept-language")
    const preferred = acceptLang?.split(",")[0].split("-")[0]
    
    // Use cookie locale if valid, otherwise use browser locale if valid, otherwise use default
    const locale = 
      (cookieLocale && PUBLIC_LOCALES.includes(cookieLocale)) ? cookieLocale :
      (preferred && PUBLIC_LOCALES.includes(preferred)) ? preferred : 
      DEFAULT_LOCALE
  
    // Redirect to locale route
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Apply to all except static files and API
    "/((?!_next|api|static|favicon.ico|robots.txt).*)",
  ],
}
