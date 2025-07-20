import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { auth } from "@/auth"
import { getEnv } from "@/env"

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Force JWT token refresh by using the update trigger
    const token = await getToken({ 
      req: request,
      secret: getEnv("NEXTAUTH_SECRET") || ""
    })

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 })
    }

    // Return success - the token will be refreshed on the next request
    return NextResponse.json({ success: true, message: "Session will be refreshed" })
    
  } catch (error) {
    console.error("Session refresh error:", error)
    return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 })
  }
}
