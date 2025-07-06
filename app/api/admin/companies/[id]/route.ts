import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = parseInt(params.id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
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
    
    // Load user data to check admin permissions
    const { default: prisma } = await import("@/lib/prisma");
    
    // Try to get user email from query params
    let email = request.nextUrl.searchParams.get('email');
    
    // If no email in query, try to get it from user_data in local storage via the header
    if (!email) {
      try {
        // Try to get user info from authorization header or cookies
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
    
    // Fetch the company
    const company = await prisma.fc_company.findUnique({
      where: { id: companyId }
    });
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    // Get user count for the company
    const userCount = await prisma.fc_user.count({
      where: { company_id: company.id }
    });
    
    return NextResponse.json({
      ...company,
      userCount
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = parseInt(params.id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
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
    
    // Load prisma client
    const { default: prisma } = await import("@/lib/prisma");
    
    // Try to get user email from query params
    let email = request.nextUrl.searchParams.get('email');
    
    // If no email in query, try to get it from user_data in local storage via the header
    if (!email) {
      try {
        // Try to get user info from authorization header or cookies
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
    
    // Get company data from request body
    const body = await request.json();
    
    if (!body.description || body.description.trim().length < 2) {
      return NextResponse.json(
        { error: "Company name is required and must be at least 2 characters" },
        { status: 400 }
      );
    }
    
    // Check if company exists
    const existingCompany = await prisma.fc_company.findUnique({
      where: { id: companyId }
    });
    
    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    // Check if another company has the same name
    const duplicateCompany = await prisma.fc_company.findFirst({
      where: {
        description: {
          equals: body.description.trim(),
          mode: 'insensitive'
        },
        id: { not: companyId }
      }
    });
    
    if (duplicateCompany) {
      return NextResponse.json(
        { error: "Another company with this name already exists" },
        { status: 409 }
      );
    }
    
    // Update company
    const updatedCompany = await prisma.fc_company.update({
      where: { id: companyId },
      data: {
        description: body.description.trim()
      }
    });
    
    // Get user count for the company
    const userCount = await prisma.fc_user.count({
      where: { company_id: updatedCompany.id }
    });
    
    return NextResponse.json({
      ...updatedCompany,
      userCount
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = parseInt(params.id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
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
    
    // Load prisma client
    const { default: prisma } = await import("@/lib/prisma");
    
    // Try to get user email from query params
    let email = request.nextUrl.searchParams.get('email');
    
    // If no email in query, try to get it from user_data in local storage via the header
    if (!email) {
      try {
        // Try to get user info from authorization header or cookies
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
    
    // Check if company exists
    const existingCompany = await prisma.fc_company.findUnique({
      where: { id: companyId }
    });
    
    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    
    // Check if there are users associated with this company
    const userCount = await prisma.fc_user.count({
      where: { company_id: companyId }
    });
    
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with associated users. Reassign users first." },
        { status: 400 }
      );
    }
    
    // Delete company
    await prisma.fc_company.delete({
      where: { id: companyId }
    });
    
    return NextResponse.json(
      { success: true, message: "Company deleted successfully" },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
