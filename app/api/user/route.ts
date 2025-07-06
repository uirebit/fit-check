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
          fc_company: {
            select: {
              id: true,
              description: true
            }
          },
          fc_user_type: true
        }
      });
      
      // Log for debugging
      console.log("Found user with company data:", {
        userId: user?.id,
        companyId: user?.company_id,
        companyInfo: user?.fc_company
      });
    } else {
      // Fallback to most recent user (for demo only)
      user = await prisma.fc_user.findFirst({
        orderBy: {
          id: 'desc'
        },
        include: {
          fc_company: {
            select: {
              id: true,
              description: true
            }
          },
          fc_user_type: true
        }
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Determine user roles based on user_type
    // Type 1 = Superadmin, Type 2 = Admin, Type 3 = Employee
    const userType = user.user_type || user.fc_user_type?.id || 3;
    const isSuperadmin = userType === 1;
    const isAdmin = userType === 1 || userType === 2; // Both superadmin and admin have admin privileges
    
    // Log user info for debugging
    console.log("API user data:", {
      email: user.email,
      userType: userType,
      userTypeName: user.fc_user_type?.description,
      isSuperadmin: isSuperadmin,
      isAdmin: isAdmin
    });
    
    // Check if we need to fetch company info separately
    let companyName = "N/A";
    if (user.company_id && (!user.fc_company || !user.fc_company.description)) {
      try {
        // Fetch company info if relationship didn't work
        const company = await prisma.fc_company.findUnique({
          where: { id: user.company_id },
          select: { description: true }
        });
        
        if (company && company.description) {
          companyName = company.description;
          console.log(`Fetched company name separately: ${companyName} for company_id: ${user.company_id}`);
        }
      } catch (err) {
        console.error("Error fetching company details:", err);
      }
    } else if (user.fc_company && user.fc_company.description) {
      companyName = user.fc_company.description;
      console.log(`Using related company name: ${companyName}`);
    }
    
    // Return user data (excluding sensitive information)
    return NextResponse.json({
      id: user.id,
      name: user.username,
      email: user.email,
      gender: user.is_male ? "Male" : "Female",
      companyId: user.company_id?.toString() || "N/A",
      companyName: companyName, // Using our verified company name
      userType: userType,
      userTypeName: user.fc_user_type?.description || "Employee",
      isAdmin: isAdmin, // Both superadmin and admin have admin privileges
      isSuperadmin: isSuperadmin, // Only superadmins can manage companies
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
