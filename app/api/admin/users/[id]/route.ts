import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH endpoint to update user type
 * Can only be accessed by superadmins
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    // Get authorization token from header or cookie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    const cookieToken = request.cookies.get('auth_token')?.value;
    
    // Use either header token or cookie token
    const authToken = token || cookieToken;
    
    if (!authToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Load user data to check superadmin permissions
    const { default: prisma } = await import("@/lib/prisma");
    
    // Try to get user email from query params
    let email = request.nextUrl.searchParams.get('email');
    
    // If no email in query, try to get it from user_data in cookies
    if (!email) {
      try {
        const sessionCookie = request.cookies.get('user_session')?.value;
        
        if (sessionCookie) {
          try {
            const sessionData = JSON.parse(decodeURIComponent(sessionCookie));
            if (sessionData && sessionData.email) {
              email = sessionData.email;
            }
          } catch (e) {
            console.error("Failed to parse session cookie:", e);
          }
        }
      } catch (e) {
        console.error("Error extracting user info:", e);
      }
    }
    
    // Check if user has superadmin privileges
    let isSuperadmin = false;
    
    if (email) {
      const requestingUser = await prisma.fc_user.findUnique({
        where: { email },
        select: { id: true, user_type: true }
      });
      
      // Only userType 1 (superadmin) can manage users
      isSuperadmin = requestingUser?.user_type === 1;
      
      // Prevent superadmins from modifying themselves to avoid lock-out
      if (isSuperadmin && requestingUser?.id === parseInt(userId)) {
        return NextResponse.json(
          { error: "Cannot modify your own user type" },
          { status: 403 }
        );
      }
    }
    
    if (!isSuperadmin) {
      return NextResponse.json(
        { error: "Unauthorized. Superadmin privileges required." },
        { status: 403 }
      );
    }
    
    // Get body data
    const body = await request.json();
    const { userType } = body;
    
    if (!userType || isNaN(parseInt(userType.toString()))) {
      return NextResponse.json(
        { error: "Valid userType is required" },
        { status: 400 }
      );
    }
    
    // Validate user type exists
    const validUserType = await prisma.fc_user_type.findUnique({
      where: { id: parseInt(userType.toString()) }
    });
    
    if (!validUserType) {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      );
    }
    
    // Verify user exists and check if they are a superadmin
    const userExists = await prisma.fc_user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        user_type: true
      }
    });
    
    if (!userExists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Prevent editing superadmins (user_type = 1)
    if (userExists.user_type === 1) {
      return NextResponse.json(
        { error: "Cannot modify superadmin user type" },
        { status: 403 }
      );
    }
    
    // Update user type
    const updatedUser = await prisma.fc_user.update({
      where: { id: parseInt(userId) },
      data: { user_type: parseInt(userType.toString()) },
      select: {
        id: true,
        username: true,
        email: true,
        user_type: true,
        fc_user_type: {
          select: {
            description: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.username,
        email: updatedUser.email,
        userType: updatedUser.user_type,
        userTypeName: updatedUser.fc_user_type?.description || null,
        isSuperadmin: updatedUser.user_type === 1,
        isAdmin: updatedUser.user_type === 1 || updatedUser.user_type === 2
      }
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
