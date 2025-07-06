import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';

// This endpoint is used to set authentication cookies from client-side code
export async function POST(request: NextRequest) {
  try {
    const { token, session } = await request.json();
    
    const response = NextResponse.json({ success: true });
    
    // Set auth cookies
    if (token) {
      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
    }
    
    if (session) {
      response.cookies.set({
        name: 'user_session',
        value: 'active',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
    }
    
    return response;
  } catch (error) {
    console.error("Error setting auth cookies:", error);
    return NextResponse.json({ error: "Failed to set auth cookies" }, { status: 500 });
  }
}
