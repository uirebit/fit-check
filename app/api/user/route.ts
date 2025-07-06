import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get authorization token from header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    // Use request cookie directly instead of cookie store
    const cookieToken = request.cookies.get('auth_token')?.value;
    
    // Use either header token or cookie token
    const authToken = token || cookieToken;
    
    if (!authToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // In a real app, you would validate the token and get user data from database
    const { default: prisma } = await import("@/lib/prisma");
    
    // Try to get email from request query if available
    const email = request.nextUrl.searchParams.get('email');
    
    let user;
    
    if (email) {
      // If we have an email, look up user by email with company relation
      user = await prisma.fc_user.findUnique({
        where: { email },
        include: {
          fc_company: true
        }
      });
    } else {
      // Fallback to most recent user (for demo only)
      user = await prisma.fc_user.findFirst({
        orderBy: {
          id: 'desc'
        },
        include: {
          fc_company: true
        }
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Return user data (excluding sensitive information)
    return NextResponse.json({
      id: user.id,
      name: user.username,
      email: user.email,
      gender: user.is_male ? "Male" : "Female",
      companyId: user.company_id?.toString() || "N/A",
      companyName: user.fc_company?.description || "N/A",
      joinDate: user.creation_date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      picture: "/placeholder-user.jpg" // In a real app, use user.profile_picture
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
