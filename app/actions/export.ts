"use server"

import { auth } from "@/auth"
import * as XLSX from 'xlsx'
import en from "@/app/locales/en"
import es from "@/app/locales/es"
import pt from "@/app/locales/pt"

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
export async function exportEmployeeMeasurements(locale: string = 'en'): Promise<ExportResponse> {
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
    
    // Validate locale and make sure it's a string
    console.log(`Original locale received: ${locale}`);
    if (!locale || typeof locale !== 'string' || !['en', 'es', 'pt'].includes(locale)) {
      console.warn(`Invalid locale provided: ${locale}, defaulting to English`);
      locale = 'en'; // Default to English if invalid locale
    }
    console.log(`Using locale: ${locale} for export`);
    
    
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
    
    // Load translations based on locale
    const translations = locale === 'es' ? es : locale === 'pt' ? pt : en;
    
    // Debug log to verify the correct locale is being used
    console.log(`Exporting with locale: ${locale}`);

    // Function to get translated text
    const t = (key: string): string => {
      const value = (translations as any)[key];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key} for locale: ${locale}`);
        return key;
      }
      return value;
    };
    
    // Function to translate clothing names if they exist in translations
    const translateClothing = (name: string): string => {
      const key = `fc_cloth.${name.toLowerCase().replace(/ /g, '_')}`;
      return t(key) !== key ? t(key) : name;
    };
    
    // Function to translate category names if they exist in translations
    const translateCategory = (name: string): string => {
      // Map of special category names that come directly from the database
      const categoryMap: Record<string, string> = {
        'clothing': 'fc_category.clothing',
        'footwear': 'fc_category.footwear',
        'head_protection': 'fc_category.head_protection',
        'hand_protection': 'fc_category.hand_protection',
        'eye_face_protection': 'fc_category.eye_face_protection',
        'respiratory_protection': 'fc_category.respiratory_protection',
        'high_visibility': 'fc_category.high_visibility',
        'thermal_clothing': 'fc_category.thermal_clothing',
        'welding': 'fc_category.welding',
        'lab_wear': 'fc_category.lab_wear'
      };
      
      // First try with the direct mapping for special database categories
      if (name.toLowerCase() in categoryMap) {
        const mappedKey = categoryMap[name.toLowerCase()];
        return t(mappedKey);
      }
      
      // Then try with exact match (for other category names)
      const exactKey = `fc_category.${name.toLowerCase().replace(/ /g, '_')}`;
      if (t(exactKey) !== exactKey) {
        return t(exactKey);
      }
      
      // If no exact match, try with the singular form (removing trailing 's')
      if (name.toLowerCase().endsWith('s')) {
        const singularKey = `fc_category.${name.toLowerCase().slice(0, -1).replace(/ /g, '_')}`;
        if (t(singularKey) !== singularKey) {
          return t(singularKey);
        }
      }
      
      // If no translation found, return the original name
      return name;
    };
    
    // Group measurements by clothing item, ID, and size
    const groupedData = new Map<string, Map<string, number>>()
    // Keep track of clothing IDs
    const clothingInfoMap = new Map<string, { id: number, originalName: string, categoryName: string }>()
    
    allMeasurements.forEach(measurement => {
      // Create a unique key including the ID to ensure we don't mix different clothes with same name
      const clothingKey = `${measurement.clothingName}|${measurement.categoryName}|${measurement.clothingId}`
      const size = measurement.calculatedSize || t('excel.unknown') || 'Unknown'
      
      if (!groupedData.has(clothingKey)) {
        groupedData.set(clothingKey, new Map<string, number>())
        clothingInfoMap.set(clothingKey, {
          id: measurement.clothingId,
          originalName: measurement.clothingName,
          categoryName: measurement.categoryName
        })
      }
      
      const sizeMap = groupedData.get(clothingKey)!
      sizeMap.set(size, (sizeMap.get(size) || 0) + 1)
    })
    
    // Convert grouped data to array for the sheet
    const orderedData = Array.from(groupedData.entries()).flatMap(([clothingKey, sizeMap]) => {
      const clothingInfo = clothingInfoMap.get(clothingKey)!
      
      return Array.from(sizeMap.entries()).map(([size, count]) => {
        // Use translations for column headers
        return {
          [t('excel.column.quantity')]: count,
          [t('excel.column.clothingId')]: clothingInfo.id,
          [t('excel.column.clothingItem')]: translateClothing(clothingInfo.originalName),
          [t('excel.column.category')]: translateCategory(clothingInfo.categoryName),
          [t('excel.column.calculatedSize')]: size
        }
      })
    })
    
    // Get the translated column names
    const colQuantity = t('excel.column.quantity');
    const colClothingId = t('excel.column.clothingId');
    const colClothingItem = t('excel.column.clothingItem');
    const colCategory = t('excel.column.category');
    const colCalculatedSize = t('excel.column.calculatedSize');
    
    // Sort by clothing item, category, and size
    orderedData.sort((a, b) => {
      if (String(a[colClothingItem]) !== String(b[colClothingItem])) {
        return String(a[colClothingItem]).localeCompare(String(b[colClothingItem]))
      }
      if (String(a[colCategory]) !== String(b[colCategory])) {
        return String(a[colCategory]).localeCompare(String(b[colCategory]))
      }
      return String(a[colCalculatedSize]).localeCompare(String(b[colCalculatedSize]))
    })
    
    const ws = XLSX.utils.json_to_sheet(orderedData)
    
    // Add worksheet to workbook - use translated sheet name
    const sheetName = t('excel.sheetName') || 'Clothing Orders'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const filePrefix = t('excel.fileName') || 'clothing_orders'
    const fileName = `${filePrefix}_${date}.xlsx`
    
    // Debug log to verify the correct filename is being generated
    console.log(`Generated filename: ${fileName} with prefix: ${filePrefix}`);
    
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
