import { NextRequest, NextResponse } from "next/server";

/**
 * GET endpoint to fetch all users
 * Filters available by query params: companyId, userType
 */
export async function GET(request: NextRequest) {
  try {
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
    
    // If no email in query, try to get it from user_data in local storage via the header
    if (!email) {
      try {
        // Try to get user info from authorization header or cookie
        const sessionCookie = request.cookies.get('user_session')?.value;
        
        if (sessionCookie) {
          // If we have session cookie with user data, use that
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
    
    // If we have an email, use it to check superadmin status
    if (email) {
      const user = await prisma.fc_user.findUnique({
        where: { email },
        select: { user_type: true }
      });
      
      // Only userType 1 (superadmin) can manage users
      isSuperadmin = user?.user_type === 1;
    }
    
    if (!isSuperadmin) {
      return NextResponse.json(
        { error: "Unauthorized. Superadmin privileges required." },
        { status: 403 }
      );
    }
    
    // Get filters from query params
    const companyId = request.nextUrl.searchParams.get('companyId');
    const userType = request.nextUrl.searchParams.get('userType');
    
    // Build filter conditions
    const whereConditions: any = {};
    
    if (companyId && !isNaN(parseInt(companyId))) {
      whereConditions.company_id = parseInt(companyId);
    }
    
    // Handle userType filter
    if (userType !== null && userType !== undefined && !isNaN(parseInt(userType))) {
      const userTypeNum = parseInt(userType);
      whereConditions.user_type = userTypeNum;
    }
    
    // Fetch users with filters
    const users = await prisma.fc_user.findMany({
      where: whereConditions,
      select: {
        id: true,
        username: true,
        email: true,
        company_id: true,
        user_type: true,
        creation_date: true,
        is_male: true,
        fc_company: {
          select: {
            id: true,
            description: true
          }
        },
        fc_user_type: {
          select: {
            id: true,
            description: true
          }
        }
      },
      orderBy: { username: 'asc' }
    });

    // Get all companies for filtering
    const companies = await prisma.fc_company.findMany({
      orderBy: { description: 'asc' },
      select: {
        id: true,
        description: true
      }
    });

    // Get all user types for filtering
    const userTypes = await prisma.fc_user_type.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        description: true
      }
    });
    
    // Format users for response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.username,
      email: user.email,
      companyId: user.company_id,
      companyName: user.fc_company?.description || null,
      userType: user.user_type,
      userTypeName: user.fc_user_type?.description || null,
      joinDate: user.creation_date,
      gender: user.is_male ? 'male' : 'female',
      isSuperadmin: user.user_type === 1,
      isAdmin: user.user_type === 1 || user.user_type === 2
    }));
    
    return NextResponse.json({
      users: formattedUsers,
      companies,
      userTypes,
      filters: {
        companyId: companyId ? parseInt(companyId) : null,
        userType: userType ? parseInt(userType) : null
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
