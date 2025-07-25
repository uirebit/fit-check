import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth' // Import auth function instead of authOptions
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth() // Use auth() instead of getServerSession(authOptions)
    
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

    // Fetch all companies with user count
    const companies = await prisma.fc_company.findMany({
      include: {
        _count: {
          select: {
            fc_user: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedCompanies = companies.map((company: {
      id: number
      description: string
      _count: { fc_user: number }
    }) => ({
      id: company.id,
      description: company.description,
      userCount: company._count.fc_user
    }))

    return NextResponse.json(transformedCompanies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth() // Use auth() instead of getServerSession(authOptions)
    
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
    
    // Get full user details from database to ensure we have the ID
    const dbUser = await prisma.fc_user.findUnique({
      where: { email: user.email },
      select: { id: true }
    })
    
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const { description } = await request.json()

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    if (description.trim().length < 2) {
      return NextResponse.json(
        { error: 'Company name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Check if company with same name already exists
    const existingCompany = await prisma.fc_company.findFirst({
      where: {
        description: {
          equals: description.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'A company with this name already exists' },
        { status: 409 }
      )
    }

    // Create new company with the creator's user ID
    const newCompany = await prisma.fc_company.create({
      data: {
        description: description.trim(),
        user_id: dbUser.id // Add user_id from the database user record
      } as any, // Use type assertion to bypass TypeScript error temporarily
      include: {
        _count: {
          select: {
            fc_user: true
          }
        }
      }
    })

    // Transform the data to match the frontend interface
    const transformedCompany = {
      id: newCompany.id,
      description: newCompany.description,
      userCount: (newCompany as any)._count?.fc_user || 0 // Use type assertion and optional chaining
    }

    return NextResponse.json(transformedCompany, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}