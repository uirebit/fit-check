"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export interface Company {
  id: number
  name: string
}

export interface CompaniesResponse {
  success: boolean
  error?: string
  companies?: Company[]
}

/**
 * Get all companies (for superadmin use)
 */
export async function getAllCompanies(): Promise<CompaniesResponse> {
  try {
    // Get current user's session
    const session = await auth()
    
    // Check authentication
    if (!session?.user?.email) {
      return {
        success: false,
        error: "Not authenticated"
      }
    }
    
    // Get user type to verify if superadmin
    const user = await prisma.fc_user.findUnique({
      where: { email: session.user.email },
      select: { user_type: true }
    })
    
    // Check if user is superadmin
    if (user?.user_type !== 1) {
      return {
        success: false,
        error: "Unauthorized: Only superadmins can view all companies"
      }
    }
    
    // Get all companies
    const companies = await prisma.fc_company.findMany({
      orderBy: {
        description: 'asc'
      },
      select: {
        id: true,
        description: true
      }
    })
    
    return {
      success: true,
      companies: companies.map(company => ({
        id: company.id,
        name: company.description
      }))
    }
    
  } catch (error) {
    console.error("Error getting companies:", error)
    return {
      success: false,
      error: "Failed to fetch companies"
    }
  }
}
