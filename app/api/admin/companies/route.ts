import { NextRequest, NextResponse } from "next/server";

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
    
    // Load user data to check admin permissions
    const { default: prisma } = await import("@/lib/prisma");
    
    // Try to get user email from query params
    let email = request.nextUrl.searchParams.get('email');
    
    // If no email in query, try to get it from user_data in local storage via the header
    if (!email) {
      try {
        // Try to get user info from authorization header
        // In a real app, this would be a JWT decode
        // For our simplified app, we'll use the user_data from cookies if available
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
    
    // Check if user has admin privileges
    let isAdmin = false;
    
    // If we have an email, use it to check admin status
    if (email) {
      const user = await prisma.fc_user.findUnique({
        where: { email },
        select: { user_type: true }
      });
      
      isAdmin = user?.user_type === 1; // Assuming 1 is admin type
    }
    
    // For development purposes: if no email found, allow access (REMOVE THIS IN PRODUCTION)
    // This is just for testing and should be removed for real apps
    if (!email) {
      console.log("DEV MODE: No email found, granting admin access for testing");
      isAdmin = true;
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }
    
    // Fetch all companies
    const companies = await prisma.fc_company.findMany({
      orderBy: { id: 'asc' },
    });
    
    // Get user count per company
    const companiesWithUserCount = await Promise.all(
      companies.map(async (company) => {
        const userCount = await prisma.fc_user.count({
          where: { company_id: company.id }
        });
        
        return {
          ...company,
          userCount
        };
      })
    );
    
    return NextResponse.json(companiesWithUserCount);
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    // Load user data to check admin permissions
    const { default: prisma } = await import("@/lib/prisma");
    
    // In a real application, validate the token and extract the user ID
    // Here we're assuming the user is admin
    // In production, you would check the user's role from the token
    
    // Get company data from request body
    const body = await request.json();
    
    if (!body.description || body.description.trim().length < 2) {
      return NextResponse.json(
        { error: "Company name is required and must be at least 2 characters" },
        { status: 400 }
      );
    }
    
    // Check if company already exists
    const existingCompany = await prisma.fc_company.findFirst({
      where: {
        description: {
          equals: body.description.trim(),
          mode: 'insensitive'
        }
      }
    });
    
    if (existingCompany) {
      return NextResponse.json(
        { error: "A company with this name already exists" },
        { status: 409 }
      );
    }
    
    // Create new company
    const newCompany = await prisma.fc_company.create({
      data: {
        description: body.description.trim()
      }
    });
    
    return NextResponse.json(newCompany, { status: 201 });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
