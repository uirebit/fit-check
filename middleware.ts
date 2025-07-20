import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt";
import { getEnv } from "./env"

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

  // Debug: Ver todas las cookies
  console.log('All cookies:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' })));
  
   // Debug: Ver específicamente la cookie de NextAuth (formato v5)
  const sessionCookie = request.cookies.get('authjs.session-token') || 
                       request.cookies.get('__Secure-authjs.session-token') ||
                       request.cookies.get('next-auth.session-token') || 
                       request.cookies.get('__Secure-next-auth.session-token');
  console.log('Session cookie exists:', !!sessionCookie);

  // Check if this is a protected path (case-insensitive)
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    // Make sure we check for the path after the locale
    pathname.replace(/^\/[a-z]{2}/, '').startsWith(path)
  );
  
  // Check if this is the root path with locale (e.g., /es/, /en/, /pt/)
  const isRootWithLocale = /^\/[a-z]{2}\/?$/.test(pathname);
  
  if (isProtectedPath || isRootWithLocale) {
    // Get locale from URL (for redirect purposes)
    const locale = pathname.split('/')[1];
    const isValidLocale = PUBLIC_LOCALES.includes(locale);
    const redirectLocale = isValidLocale ? locale : DEFAULT_LOCALE;
    
    // Check NextAuth session
    const token = await getToken({
      req: request,
      secret: getEnv("NEXTAUTH_SECRET") || "",
      // Add explicit cookie name for NextAuth v5
      cookieName: process.env.NODE_ENV === "production" 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token"
    });

    // Debug: Ver el contenido del token
    console.log('Token debug:', {
      hasToken: !!token,
      pathname,
      userEmail: token?.email,
      userType: token?.userType,
      isSuperadmin: token?.isSuperadmin,
      cookieExists: !!sessionCookie
    });    
    
    if (!token) {
      console.log('No token found - redirecting to login');
      // No session found
      if (isRootWithLocale) {
        // Allow access to root path for login
        return NextResponse.next();
      }
      // Redirect to login page for protected paths
      return NextResponse.redirect(new URL(`/${redirectLocale}`, request.url));
    }
    
    // User is authenticated - extract token data
    const companyId = token.companyId as string | null | undefined;
    const gender = token.gender as string | null | undefined;
    const isSuperadmin = token.isSuperadmin as boolean | undefined;
    const userType = token.userType as number | undefined;
    const isAdmin = token.isAdmin as boolean | undefined;
    
    // Check for admin paths first (before onboarding check)
    const isAdminPath = ADMIN_PATHS.some(path => 
      pathname.replace(/^\/[a-z]{2}/, '').startsWith(path)
    );
    
    if (isAdminPath) {
      console.log('Admin path check:', {
        pathname,
        userType,
        isSuperadmin,
        isAdmin,
        hasAccess: userType === 1 || userType === 2 || isAdmin === true || isSuperadmin === true
      });

      // Admin access is granted to userType 1 (superadmin) or 2 (admin), or if isAdmin/isSuperadmin flags are true
      if (!(userType === 1 || userType === 2 || isAdmin === true || isSuperadmin === true)) {
        // User doesn't have admin privileges, redirect to dashboard
        console.log('Access denied - redirecting to dashboard');
        return NextResponse.redirect(new URL(`/${redirectLocale}/dashboard`, request.url));
      }
      // User has admin privileges, allow access to admin routes
      console.log('Access granted to admin path');
      return NextResponse.next();
    }
    
    // Check if they're trying to access root/login page
    if (isRootWithLocale) {
      // If user is superadmin, redirect to dashboard
      if (isSuperadmin) {
        return NextResponse.redirect(new URL(`/${redirectLocale}/dashboard`, request.url));
      }
      
      // If user needs onboarding (missing company or gender), redirect to onboarding
      if (!companyId || !gender) {
        return NextResponse.redirect(new URL(`/${redirectLocale}/onboarding`, request.url));
      }
      
      // User is complete, redirect to dashboard
      return NextResponse.redirect(new URL(`/${redirectLocale}/dashboard`, request.url));
    }
    
    // Handle other protected paths
    const isOnboardingPath = pathname.replace(/^\/[a-z]{2}/, '').startsWith('/onboarding');
    
    // Check if onboarding was just completed (indicated by query parameter)
    const onboardingCompleted = searchParams.get('onboarding-completed') === 'true';
    
    // Debug logging
    console.log('Middleware check:', {
      pathname,
      isOnboardingPath,
      isAdminPath,
      companyId,
      gender,
      isSuperadmin,
      userType,
      isAdmin,
      onboardingCompleted,
      needsOnboarding: !companyId || !gender
    });
    
    // If onboarding was just completed, allow access to dashboard even if token isn't updated yet
    if (onboardingCompleted && pathname.replace(/^\/[a-z]{2}/, '').startsWith('/dashboard')) {
      console.log('Allowing dashboard access after onboarding completion');
      return NextResponse.next();
    }
    
    // For superadmins, skip onboarding requirements (they can access everything)
    if (isSuperadmin) {
      return NextResponse.next();
    }
    
    // Redirect to onboarding if user doesn't have companyId or gender (unless already on onboarding)
    if (!isOnboardingPath && (!companyId || !gender)) {
      console.log('Redirecting to onboarding');
      return NextResponse.redirect(new URL(`/${redirectLocale}/onboarding`, request.url));
    }
    
    // If user is on onboarding page but already has complete data, redirect to dashboard
    if (isOnboardingPath && companyId && gender) {
      console.log('Redirecting to dashboard from onboarding');
      return NextResponse.redirect(new URL(`/${redirectLocale}/dashboard`, request.url));
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