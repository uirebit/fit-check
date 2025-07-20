"use server"

import { auth } from "@/auth"
import * as XLSX from 'xlsx'

// Types for measurement data
interface UserMeasurement {
  userId: number
  userName: string
  userEmail: string
  clothingId: number
  clothingName: string
  categoryName: string
  measurementData: MeasurementData[]
  calculatedSize: string | null
  savedAt: string | null
}

interface MeasurementData {
  measureKey: string
  measureValue: number | null
}

interface ExportResponse {
  success: boolean
  error?: string
  fileContent?: string // Base64 encoded Excel file
  fileName?: string
}

/**
 * Export employee measurements for a specific company as an Excel file
 * Only accessible by admin users
 */
export async function exportEmployeeMeasurements(): Promise<ExportResponse> {
  try {
    // Get the current session
    const session = await auth()
    
    // Check if the user is authenticated
    if (!session?.user?.email) {
      console.error("No authenticated user found")
      return { 
        success: false, 
        error: "Authentication required" 
      }
    }
    
    // Import Prisma
    const { default: prisma } = await import("@/lib/prisma")
    
    // Get the user with role
    const user = await prisma.fc_user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        user_type: true,
        company_id: true
      }
    })
    
    // Check if user is admin (user_type 1 or 2)
    if (!user || (user.user_type !== 1 && user.user_type !== 2)) {
      console.error("User doesn't have admin privileges")
      return { 
        success: false, 
        error: "Admin privileges required" 
      }
    }
    
    // Check if user has company assigned
    if (!user.company_id) {
      return { 
        success: false, 
        error: "User's company not found" 
      }
    }
    
    // Get all users from the same company
    const companyUsers = await prisma.fc_user.findMany({
      where: {
        company_id: user.company_id
      },
      select: {
        id: true,
        username: true,
        email: true,
        is_male: true,
        fc_cloth_measurements: {
          include: {
            fc_cloth: {
              include: {
                fc_cloth_category: true
              }
            },
            fc_cloth_measurement_value: true
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    })
    
    // If no users found, return error
    if (!companyUsers || companyUsers.length === 0) {
      return { 
        success: false, 
        error: "No users found for this company" 
      }
    }
    
    // Get all cloth measure mappings to associate measure numbers with keys
    const allMeasureMappings = await prisma.fc_cloth_measure_mapping.findMany({
      where: {
        cloth_id: {
          in: companyUsers.flatMap((user: any) => 
            user.fc_cloth_measurements.map((measurement: any) => measurement.cloth_id)
          )
        }
      }
    })
    
    // Create a mapping for faster lookups
    const measureMappingsMap = new Map<number | null | undefined, Map<number | null, string>>()
    allMeasureMappings.forEach((mapping: any) => {
      if (!measureMappingsMap.has(mapping.cloth_id)) {
        measureMappingsMap.set(mapping.cloth_id, new Map())
      }
      if (mapping.measure_number !== null && mapping.measure_key !== null) {
        measureMappingsMap.get(mapping.cloth_id)?.set(mapping.measure_number, mapping.measure_key)
      }
    })
    
    // Process all users' measurements
    const allMeasurements: UserMeasurement[] = []
    
    companyUsers.forEach((companyUser: any) => {
      // Get the latest measurement for each clothing type
      const latestMeasurements = new Map<number, any>()
      
      companyUser.fc_cloth_measurements.forEach((measurement: any) => {
        // If we haven't seen this clothing id yet, or this measurement is newer
        if (!latestMeasurements.has(measurement.cloth_id) || 
            (latestMeasurements.get(measurement.cloth_id).created_at === null || 
             (measurement.created_at !== null && 
              measurement.created_at > latestMeasurements.get(measurement.cloth_id).created_at))) {
          latestMeasurements.set(measurement.cloth_id, measurement)
        }
      })
      
      // Process each latest measurement
      latestMeasurements.forEach(measurement => {
        const measurementValues = measurement.fc_cloth_measurement_value
        const clothMeasureMappings = measureMappingsMap.get(measurement.cloth_id) || new Map()
        
        // Transform measurement values with their keys
        const measurementData: MeasurementData[] = measurementValues.map((value: any) => {
          const measureKey = clothMeasureMappings.get(value.measure_number) || `measure_${value.measure_number}`
          return {
            measureKey,
            measureValue: value.measure_value
          }
        })
        
        // Add to measurements array
        allMeasurements.push({
          userId: companyUser.id,
          userName: companyUser.username,
          userEmail: companyUser.email,
          clothingId: measurement.cloth_id,
          clothingName: measurement.fc_cloth.description,
          categoryName: measurement.fc_cloth.fc_cloth_category?.description || 'Unknown',
          measurementData,
          calculatedSize: measurement.calculated_size,
          savedAt: measurement.created_at ? measurement.created_at.toISOString() : null
        })
      })
    })
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Create worksheet with all measurements
    const flattenedData = allMeasurements.map(measurement => {
      // Basic data
      const baseData: any = {
        'User ID': measurement.userId,
        'User Name': measurement.userName,
        'User Email': measurement.userEmail,
        'Clothing Item': measurement.clothingName,
        'Category': measurement.categoryName,
        'Calculated Size': measurement.calculatedSize || 'Unknown',
        'Saved At': measurement.savedAt || 'Unknown'
      }
      
      // Add measurement data as columns
      measurement.measurementData.forEach(data => {
        baseData[data.measureKey] = data.measureValue
      })
      
      return baseData
    })
    
    const ws = XLSX.utils.json_to_sheet(flattenedData)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Measurements')
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const fileName = `employee_measurements_${date}.xlsx`
    
    return {
      success: true,
      fileContent: excelBuffer,
      fileName
    }
    
  } catch (error) {
    console.error("Error exporting employee measurements:", error)
    let errorMessage = "Failed to export employee measurements"
    
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, Message: ${error.message}`)
      errorMessage = `Export error: ${error.message}`
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}
