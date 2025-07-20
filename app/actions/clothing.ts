"use server"

// Prisma model types - these should match your database schema
interface PrismaFcClothMeasureMapping {
  id: number;
  cloth_id: number | null;
  measure_number: number | null;
  measure_key: string | null;
}

interface PrismaFcClothMeasurementValue {
  id: number;
  measurement_id: number;
  measure_number: number;
  measure_value: number | null;
}

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

interface PrismaFcClothMeasurement {
  id: number;
  user_id: number;
  cloth_id: number;
  calculated_size: string | null;
  created_at: Date | null;
  fc_cloth_measurement_value: PrismaFcClothMeasurementValue[];
}

export interface ClothingItem {
  id: string;
  description: string;
  category_id?: number;
  category_description?: string;
  categoryTranslationKey?: string;
  translationKey?: string;
}

export interface ClothingMeasureMapping {
  id: number;
  cloth_id: number;
  measure_number: number;
  measure_key: string;
}

export interface SavedMeasurement {
  id: number;
  created_at: string;
  values: {
    measure_number: number;
    measure_key: string;
    measure_value: number;
  }[];
}

export async function getClothingMeasureMappings(clothingId: string): Promise<ClothingMeasureMapping[]> {
  try {
    console.log(`Fetching measure mappings for clothing ID: ${clothingId}`);
    
    // Validate clothingId
    if (!clothingId) {
      console.error("Invalid clothing ID provided");
      return [];
    }
    
    const { default: prisma } = await import("@/lib/prisma");
    
    // Parse clothingId once to avoid multiple conversions
    const parsedClothingId = parseInt(clothingId, 10);
    
    if (isNaN(parsedClothingId)) {
      console.error("Invalid clothing ID format, must be a number:", clothingId);
      return [];
    }
    
    // Get measure mappings for a specific clothing item
    const mappings = await prisma.fc_cloth_measure_mapping.findMany({
      where: {
        cloth_id: parsedClothingId
      },
      orderBy: {
        measure_number: 'asc'
      }
    });
    
    console.log(`Found ${mappings.length} measure mappings for clothing ID: ${clothingId}`);
    
    return mappings as ClothingMeasureMapping[];
  } catch (error) {
    console.error(`Error fetching clothing measure mappings for ID ${clothingId}:`, error);
    return [];
  }
}

export async function getCompanyClothingItems(): Promise<ClothingItem[]> {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/auth");
    
    // Get the authenticated session
    const session = await auth();
    
    // If no session or email, return empty array
    if (!session || !session.user?.email) {
      console.log("No authenticated session found");
      return [];
    }
    
    const userEmail = session.user.email;
    
    // Get user info including company ID from database
    const user = await prisma.fc_user.findFirst({
      where: { email: userEmail },
      select: {
        company_id: true
      }
    });
    
    if (!user || !user.company_id) {
      console.log("User not found or has no company ID");
      return [];
    }
    
    const companyId = user.company_id;
    console.log(`Fetching clothing items for company ID: ${companyId}`);
    
    // Get company-specific clothing items
    const companyClothes = await prisma.fc_company_cloth.findMany({
      where: {
        company_id: companyId
      },
      include: {
        fc_cloth: {
          include: {
            fc_cloth_category: true // Include the category data
          }
        }        
      }
    });
    
    // Map to the expected format
    const clothingItems = companyClothes.map((item: PrismaFcCompanyCloth) => ({
      id: item.fc_cloth.id.toString(),
      description: item.fc_cloth.description,
      category_id: item.fc_cloth.category_id || undefined,
      category_description: item.fc_cloth.fc_cloth_category?.description || undefined,
      // Create translation key for category (e.g. "Head Protection" -> "category.head_protection")
      categoryTranslationKey: item.fc_cloth.fc_cloth_category?.description ? 
                             `category.${item.fc_cloth.fc_cloth_category.description.toLowerCase().replace(/\s+/g, "_")}` : 
                             undefined,
      // Create translation key for cloth item (e.g. "work_pants" -> "fc_cloth.work_pants")
      translationKey: `fc_cloth.${item.fc_cloth.description}`
    }));
    
    console.log(`Found ${clothingItems.length} clothing items for company ${companyId}`);
    return clothingItems;
    
  } catch (error) {
    console.error("Error fetching company clothing items:", error);
    return [];
  }
}

export async function getUserMeasurements(clothingId: string): Promise<SavedMeasurement | null> {
  try {
    console.log(`Fetching measurements for clothing ID: ${clothingId}`);
    const { default: prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/auth");
    
    // Get the authenticated session
    const session = await auth();
    
    // If no session or email, return null
    if (!session || !session.user?.email) {
      console.log("No authenticated session found");
      return null;
    }
    
    const userEmail = session.user.email;
    
    // Get user ID
    const user = await prisma.fc_user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.log("User not found");
      return null;
    }
    
    // Parse clothing ID once to avoid multiple conversions
    const parsedClothingId = parseInt(clothingId, 10);
    
    // Get the latest measurement for this clothing type
    const measurement = await prisma.fc_cloth_measurements.findFirst({
      where: {
        user_id: user.id,
        cloth_id: parsedClothingId
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        fc_cloth_measurement_value: true
      }
    });
    
    if (!measurement) {
      console.log(`No saved measurements found for clothing ID: ${clothingId}`);
      return null;
    }
    
    // Get the mappings to know which measure_key corresponds to each measure_number
    const mappings = await prisma.fc_cloth_measure_mapping.findMany({
      where: {
        cloth_id: parsedClothingId
      }
    });
    
    // Create a map for faster lookups instead of using find() in a loop
    const mappingMap = new Map();
    mappings.forEach((mapping: PrismaFcClothMeasureMapping) => {
      if (mapping.measure_number !== null && mapping.measure_key !== null) {
        mappingMap.set(mapping.measure_number, mapping.measure_key);
      }
    });
    
    // Combine measurement values with their corresponding keys
    const values = measurement.fc_cloth_measurement_value.map((value: PrismaFcClothMeasurementValue) => {
      const measureKey = mappingMap.get(value.measure_number) || `measure_${value.measure_number}`;
      return {
        measure_number: value.measure_number,
        measure_key: measureKey,
        measure_value: value.measure_value || 0
      };
    });
    
    console.log(`Found ${values.length} measurement values for clothing ID: ${clothingId}`);
    
    return {
      id: measurement.id,
      created_at: measurement.created_at?.toISOString() || new Date().toISOString(),
      values
    };
  } catch (error) {
    console.error("Error fetching user measurements:", error);
    return null;
  }
}