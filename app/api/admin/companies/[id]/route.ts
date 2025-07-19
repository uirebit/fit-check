import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = parseInt(params.id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
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
        { error: 'Unauthorized. Superadmin access required.' },
        { status: 403 }
      )
    }

    // Fetch the company
    const company = await prisma.fc_company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            fc_user: true
          }
        }
      }
    });
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedCompany = {
      id: company.id,
      description: company.description,
      userCount: company._count.fc_user
    }

    return NextResponse.json(transformedCompany);
    
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
        { error: 'Unauthorized. Superadmin access required.' },
        { status: 403 }
      )
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
      },
      include: {
        _count: {
          select: {
            fc_user: true
          }
        }
      }
    });

    // Transform the data to match the frontend interface
    const transformedCompany = {
      id: updatedCompany.id,
      description: updatedCompany.description,
      userCount: updatedCompany._count.fc_user
    }

    return NextResponse.json(transformedCompany);
    
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
        { error: 'Unauthorized. Superadmin access required.' },
        { status: 403 }
      )
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