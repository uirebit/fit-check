"use server"

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
    const { default: prisma } = await import("@/lib/prisma");
    
    // Get measure mappings for a specific clothing item
    const mappings = await prisma.fc_cloth_measure_mapping.findMany({
      where: {
        cloth_id: parseInt(clothingId, 10)
      },
      orderBy: {
        measure_number: 'asc'
      }
    });
    
    return mappings as ClothingMeasureMapping[];
  } catch (error) {
    console.error("Error fetching clothing measure mappings:", error);
    return [];
  }
}

export async function getCompanyClothingItems(userEmail?: string): Promise<ClothingItem[]> {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    
    // If no email was provided, return empty array
    // The email will be passed from the client component that accesses localStorage
    if (!userEmail) {
      console.log("No user email provided");
      return [];
    }
    
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
    const clothingItems = companyClothes.map(item => ({
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

export async function getUserMeasurements(userEmail: string, clothingId: string): Promise<SavedMeasurement | null> {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    
    // Get user ID
    const user = await prisma.fc_user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.log("User not found");
      return null;
    }
    
    // Get the latest measurement for this clothing type
    const measurement = await prisma.fc_cloth_measurements.findFirst({
      where: {
        user_id: user.id,
        cloth_id: parseInt(clothingId, 10)
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        fc_cloth_measurement_value: true
      }
    });
    
    if (!measurement) {
      return null;
    }
    
    // Get the mappings to know which measure_key corresponds to each measure_number
    const mappings = await prisma.fc_cloth_measure_mapping.findMany({
      where: {
        cloth_id: parseInt(clothingId, 10)
      }
    });
    
    // Combine measurement values with their corresponding keys
    const values = measurement.fc_cloth_measurement_value.map(value => {
      const mapping = mappings.find(m => m.measure_number === value.measure_number);
      return {
        measure_number: value.measure_number,
        measure_key: mapping?.measure_key || `measure_${value.measure_number}`,
        measure_value: value.measure_value || 0
      };
    });
    
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