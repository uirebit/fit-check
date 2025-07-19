import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET endpoint to fetch a specific user
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

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

    // Fetch the user
    const targetUser = await prisma.fc_user.findUnique({
      where: { id: userId },
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
    
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Format user for response
    const formattedUser = {
      id: targetUser.id,
      name: targetUser.username,
      email: targetUser.email,
      companyId: targetUser.company_id,
      companyName: targetUser.fc_company?.description || null,
      userType: targetUser.user_type,
      userTypeName: targetUser.fc_user_type?.description || null,
      joinDate: targetUser.creation_date,
      gender: targetUser.is_male ? 'male' : 'female',
      isSuperadmin: targetUser.user_type === 1,
      isAdmin: targetUser.user_type === 1 || targetUser.user_type === 2
    };

    return NextResponse.json(formattedUser);
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update a specific user
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

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
    const { userType } = body;

    if (userType === undefined) {
      return NextResponse.json(
        { error: "User type is required" },
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

    // Prevent changing another superadmin's type
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