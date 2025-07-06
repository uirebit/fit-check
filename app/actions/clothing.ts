"use server"

export interface ClothingItem {
  id: string;
  description: string;
  category_id?: number;
  category_description?: string;
  categoryTranslationKey?: string;
  translationKey?: string;
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