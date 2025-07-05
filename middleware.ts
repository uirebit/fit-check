import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_LOCALES = ["en", "es", "pt"]
const DEFAULT_LOCALE = "pt"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If already has locale, do nothing
  if (PUBLIC_LOCALES.some((locale) => pathname.startsWith(`/${locale}`))) {
    return NextResponse.next()
  }

  // Detect browser language
  const acceptLang = request.headers.get("accept-language")
  const preferred = acceptLang?.split(",")[0].split("-")[0]
  const locale = PUBLIC_LOCALES.includes(preferred!) ? preferred : DEFAULT_LOCALE

  // Redirect to locale route
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
}

export const config = {
  matcher: [
    // Apply to all except static files and API
    "/((?!_next|api|static|favicon.ico|robots.txt).*)",
  ],
}
