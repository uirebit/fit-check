import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET endpoint to fetch all users
 * Filters available by query params: companyId, userType
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = session.user as any
    
    // Check if user is superadmin
    const isSuperadmin = user.isSuperadmin === true || user.userType === 1
    
    if (!isSuperadmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Superadmin privileges required.' },
        { status: 403 }
      )
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
    type UserType = {
      id: number;
      username: string;
      email: string;
      company_id: number | null;
      user_type: number;
      creation_date: Date;
      is_male: boolean | null;
      fc_company?: {
        id: number;
        description: string;
      } | null;
      fc_user_type?: {
        id: number;
        description: string;
      } | null;
    };

    const formattedUsers = users.map((user: UserType) => ({
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

/**
 * PUT endpoint to update user type
 */
export async function PUT(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = session.user as any
    
    // Check if user is superadmin
    const isSuperadmin = user.isSuperadmin === true || user.userType === 1
    
    if (!isSuperadmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Superadmin privileges required.' },
        { status: 403 }
      )
    }

    const body = await request.json();
    const { userId, userType } = body;

    if (!userId || userType === undefined) {
      return NextResponse.json(
        { error: "User ID and user type are required" },
        { status: 400 }
      );
    }

    // Validate userType
    if (![1, 2, 3].includes(userType)) {
      return NextResponse.json(
        { error: "Invalid user type. Must be 1 (Superadmin), 2 (Admin), or 3 (Employee)" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.fc_user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        user_type: true,
        username: true
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent changing another superadmin's type (only superadmins can change types)
    if (targetUser.user_type === 1 && targetUser.email !== user.email) {
      return NextResponse.json(
        { error: "Cannot modify another superadmin's user type" },
        { status: 403 }
      );
    }

    // Update user type
    const updatedUser = await prisma.fc_user.update({
      where: { id: userId },
      data: { user_type: userType },
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
      }
    });

    // Format user for response
    const formattedUser = {
      id: updatedUser.id,
      name: updatedUser.username,
      email: updatedUser.email,
      companyId: updatedUser.company_id,
      companyName: updatedUser.fc_company?.description || null,
      userType: updatedUser.user_type,
      userTypeName: updatedUser.fc_user_type?.description || null,
      joinDate: updatedUser.creation_date,
      gender: updatedUser.is_male ? 'male' : 'female',
      isSuperadmin: updatedUser.user_type === 1,
      isAdmin: updatedUser.user_type === 1 || updatedUser.user_type === 2
    };

    return NextResponse.json({
      success: true,
      message: "User type updated successfully",
      user: formattedUser
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}