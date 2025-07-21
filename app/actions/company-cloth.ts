"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// Prisma model types - these should match your database schema
interface PrismaFcClothCategory {
  id: number;
  description: string;
}

interface PrismaFcCloth {
  id: number;
  category_id: number | null;
  description: string;
  fc_cloth_category: PrismaFcClothCategory | null;
}

interface PrismaFcCompanyCloth {
  id: number;
  company_id: number;
  cloth_id: number;
  is_active: boolean | null;
  fc_cloth: PrismaFcCloth;
}

export interface CompanyCloth {
  id: string
  clothId: number
  companyId: number
  description: string
  category: string
  isActive: boolean
}

export interface AllClothingItem {
  id: number
  description: string
  category: string
  isAssigned: boolean
}

export interface CompanyClothResponse {
  success: boolean
  error?: string
  message?: string
  companyClothes?: CompanyCloth[]
}

export interface AllClothingResponse {
  success: boolean
  error?: string
  message?: string
  allClothes?: AllClothingItem[]
}

/**
 * Get all clothing items assigned to a company
 */
export async function getCompanyClothes(companyId?: number): Promise<CompanyClothResponse> {
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
    
    // Get user's info
    const { default: prisma } = await import("@/lib/prisma")
    const user = await prisma.fc_user.findUnique({
      where: { email: session.user.email },
      select: { company_id: true, user_type: true }
    })
    
    // If companyId is not provided, use the user's company
    const targetCompanyId = companyId || user?.company_id;
    
    // Check if we have a valid company ID
    if (!targetCompanyId) {
      return {
        success: false,
        error: "No company specified"
      }
    }
    
    // Check if user is admin for their company or superadmin for any company
    if (user?.user_type !== 1 && (user?.user_type !== 2 || companyId)) {
      return {
        success: false,
        error: "Unauthorized: Only admins can manage their own company clothes or superadmins can manage any company clothes"
      }
    }
    
    // Get company clothes
    const companyClothes = await prisma.fc_company_cloth.findMany({
      where: {
        company_id: targetCompanyId
      },
      include: {
        fc_cloth: {
          include: {
            fc_cloth_category: true
          }
        }
      },
      orderBy: {
        fc_cloth: {
          description: 'asc'
        }
      }
    })
    
    // Format the response
    const formattedClothes = companyClothes.map((item: PrismaFcCompanyCloth) => ({
      id: item.id.toString(),
      clothId: item.cloth_id,
      companyId: item.company_id,
      description: item.fc_cloth.description,
      category: item.fc_cloth.fc_cloth_category?.description || 'Uncategorized',
      isActive: item.is_active || false
    }))
    
    return {
      success: true,
      companyClothes: formattedClothes
    }
    
  } catch (error) {
    console.error("Error getting company clothes:", error)
    return {
      success: false,
      error: "Failed to fetch company clothes"
    }
  }
}

/**
 * Get all available clothing items that can be assigned to a company
 */
export async function getAllClothingItems(companyId?: number): Promise<AllClothingResponse> {
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
    
    // Get user's info
    const { default: prisma } = await import("@/lib/prisma")
    const user = await prisma.fc_user.findUnique({
      where: { email: session.user.email },
      select: { company_id: true, user_type: true }
    })
    
    // If companyId is not provided, use the user's company
    const targetCompanyId = companyId || user?.company_id;
    
    // Check if we have a valid company ID
    if (!targetCompanyId) {
      return {
        success: false,
        error: "No company specified"
      }
    }
    
    // Check if user is admin for their company or superadmin for any company
    if (user?.user_type !== 1 && (user?.user_type !== 2 || companyId)) {
      return {
        success: false,
        error: "Unauthorized: Only admins can manage their own company clothes or superadmins can manage any company clothes"
      }
    }
    
    // Get all clothing items
    const allClothes = await prisma.fc_cloth.findMany({
      include: {
        fc_cloth_category: true
      },
      orderBy: {
        description: 'asc'
      }
    })
    
    // Get current company clothes
    const companyClothes = await prisma.fc_company_cloth.findMany({
      where: {
        company_id: targetCompanyId
      },
      select: {
        cloth_id: true
      }
    })
    
    // Set of clothes already assigned to the company
    const assignedClothIds = new Set(companyClothes.map((item: { cloth_id: number }) => item.cloth_id))
    
    // Format the response
    const formattedClothes = allClothes.map((item: PrismaFcCloth) => ({
      id: item.id,
      description: item.description,
      category: item.fc_cloth_category?.description || 'Uncategorized',
      isAssigned: assignedClothIds.has(item.id)
    }))
    
    return {
      success: true,
      allClothes: formattedClothes
    }
    
  } catch (error) {
    console.error("Error getting all clothing items:", error)
    return {
      success: false,
      error: "Failed to fetch clothing items"
    }
  }
}

/**
 * Add clothing items to a company
 */
export async function addClothesToCompany(clothIds: number[], companyId?: number): Promise<CompanyClothResponse> {
  try {
    // Validate input
    if (!clothIds || !clothIds.length) {
      return {
        success: false,
        error: "No clothing items selected"
      }
    }
    
    // Get current user's session
    const session = await auth()
    
    // Check authentication
    if (!session?.user?.email) {
      return {
        success: false,
        error: "Not authenticated"
      }
    }
    
    // Get user's info
    const { default: prisma } = await import("@/lib/prisma")
    const user = await prisma.fc_user.findUnique({
      where: { email: session.user.email },
      select: { company_id: true, user_type: true }
    })
    
    // If companyId is not provided, use the user's company
    const targetCompanyId = companyId || user?.company_id;
    
    // Check if we have a valid company ID
    if (!targetCompanyId) {
      return {
        success: false,
        error: "No company specified"
      }
    }
    
    // Check permissions: regular admins can only manage their company, superadmins can manage any company
    if (user?.user_type !== 1 && (user?.user_type !== 2 || companyId)) {
      return {
        success: false,
        error: "Unauthorized: Only admins can manage their own company clothes or superadmins can manage any company clothes"
      }
    }
    
    // Add each clothing item to the company
    const createPromises = clothIds.map(clothId => 
      prisma.fc_company_cloth.upsert({
        where: {
          // Use the unique constraint
          company_id_cloth_id: {
            company_id: targetCompanyId,
            cloth_id: clothId
          }
        },
        update: {
          is_active: true // If it exists but was inactive, make it active
        },
        create: {
          company_id: targetCompanyId,
          cloth_id: clothId,
          is_active: true
        }
      })
    )
    
    await Promise.all(createPromises)
    
    // Revalidate the path to update the UI
    revalidatePath('/[locale]/admin/company-cloth-management')
    
    return {
      success: true,
      message: `Successfully added ${clothIds.length} clothing items to your company`
    }
    
  } catch (error) {
    console.error("Error adding clothes to company:", error)
    return {
      success: false,
      error: "Failed to add clothing items to company"
    }
  }
}

/**
 * Remove clothing items from a company
 */
export async function removeClothFromCompany(companyClothIds: string[], companyId?: number): Promise<CompanyClothResponse> {
  try {
    // Validate input
    if (!companyClothIds || !companyClothIds.length) {
      return {
        success: false,
        error: "No items selected for removal"
      }
    }
    
    // Get current user's session
    const session = await auth()
    
    // Check authentication
    if (!session?.user?.email) {
      return {
        success: false,
        error: "Not authenticated"
      }
    }
    
    // Get user's info
    const { default: prisma } = await import("@/lib/prisma")
    const user = await prisma.fc_user.findUnique({
      where: { email: session.user.email },
      select: { company_id: true, user_type: true }
    })
    
    // If companyId is not provided, use the user's company
    const targetCompanyId = companyId || user?.company_id;
    
    // Check if we have a valid company ID
    if (!targetCompanyId) {
      return {
        success: false,
        error: "No company specified"
      }
    }
    
    // Check permissions: regular admins can only manage their company, superadmins can manage any company
    if (user?.user_type !== 1 && (user?.user_type !== 2 || companyId)) {
      return {
        success: false,
        error: "Unauthorized: Only admins can manage their own company clothes or superadmins can manage any company clothes"
      }
    }
    
    // Convert IDs to numbers
    const ids = companyClothIds.map(id => parseInt(id))
    
    // Remove each clothing item from the company
    await prisma.fc_company_cloth.deleteMany({
      where: {
        id: {
          in: ids
        },
        company_id: targetCompanyId
      }
    })
    
    // Revalidate the path to update the UI
    revalidatePath('/[locale]/admin/company-cloth-management')
    
    return {
      success: true,
      message: `Successfully removed ${ids.length} clothing items from your company`
    }
    
  } catch (error) {
    console.error("Error removing clothes from company:", error)
    return {
      success: false,
      error: "Failed to remove clothing items from company"
    }
  }
}
