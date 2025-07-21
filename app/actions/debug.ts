"use server"

import { getClothingMeasureMappings } from "./clothing";

export async function debugGetTemplates(clothingId: string) {
  try {
    console.log("DEBUG: Fetching templates for clothing ID:", clothingId);
    
    const { default: prisma } = await import("@/lib/prisma");
    
    // Parse clothingId to number
    const parsedClothingId = parseInt(clothingId, 10);
    
    if (isNaN(parsedClothingId)) {
      console.error("Invalid clothing ID format:", clothingId);
      return { error: "Invalid ID format" };
    }
    
    // Get the measure mappings
    const mappings = await getClothingMeasureMappings(clothingId);
    console.log("DEBUG: Measure mappings found:", mappings);
    
    // Get the size templates
    let templates;
    try {
      templates = await (prisma as any).fc_cloth_size_template.findMany({
        where: {
          cloth_id: parsedClothingId
        },
        include: {
          fc_cloth_measure_mapping: true
        },
        orderBy: {
          priority: 'desc'
        }
      });
      
      // Call the size calculation server function to test it directly
      console.log("DEBUG: Testing server calculation function");
      const { calculateSizeFromServer } = await import("./sizes-calculation");
      const testSize = await calculateSizeFromServer(clothingId, {
        "chest": "100", 
        "waist": "90"
      });
      console.log("DEBUG: Server calculation result:", testSize);
    } catch (error) {
      console.error("Error fetching templates:", error);
      templates = [];
    }
    
    console.log("DEBUG: Size templates found:", templates);
    
    // Count the templates
    const templateCount = await (prisma as any).fc_cloth_size_template.count({
      where: { cloth_id: parsedClothingId }
    });
    
    // Get all templates to check if table has data at all
    const allTemplatesCount = await (prisma as any).fc_cloth_size_template.count();
    
    return {
      clothingId: parsedClothingId,
      mappingsFound: mappings.length,
      templatesFound: templates.length,
      templateCount,
      allTemplatesCount,
      templates,
      mappings
    };
  } catch (error) {
    console.error("Error in debugGetTemplates:", error);
    return { error: String(error) };
  }
}
