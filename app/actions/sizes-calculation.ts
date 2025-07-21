"use server"

import prisma from "@/lib/prisma";

interface ClothSizeTemplate {
  id: number;
  cloth_id: number;
  measure_mapping_id: number;
  size_label: string;
  min_value: number;
  max_value: number;
  priority: number;
  fc_cloth_measure_mapping: {
    id: number;
    cloth_id: number;
    measure_number: number;
    measure_key: string;
  };
}

interface MeasurementTemplate {
  measureKey: string;
  templates: Array<{
    sizeLabel: string;
    minValue: number;
    maxValue: number;
    priority: number;
  }>;
}

interface SizeResult {
  size: string;
  priority: number;
}

/**
 * Default size fallback function in case no templates are found.
 * This is used as a backup only.
 */
function getDefaultSize(): string {
  // Simply return a medium size as default
  return "M";
}

export async function calculateSizeFromServer(clothId: string, measurements: Record<string, string>): Promise<string> {
  console.log('Server: calculateSizeFromServer called with clothId:', clothId);
  console.log('Server: Measurements provided:', measurements);
  
  try {
    const clothIdNumber = parseInt(clothId, 10);
    console.log('Server: Converted clothId to number:', clothIdNumber);
    
    if (isNaN(clothIdNumber)) {
      console.error('Server: Invalid clothing ID provided:', clothId);
      return getDefaultSize();
    }

    try {
      // Get size templates from the database
      console.log('Server: Fetching size templates for cloth ID:', clothIdNumber);
      
      // Using prisma directly (imported at the top)
      const sizeTemplates = await (prisma as any).fc_cloth_size_template.findMany({
        where: {
          cloth_id: clothIdNumber
        },
        include: {
          fc_cloth_measure_mapping: true
        },
        orderBy: {
          priority: 'desc'
        }
      }) as ClothSizeTemplate[];
      
      console.log(`Server: Found ${sizeTemplates?.length || 0} size templates`);
      
      // If no templates found, use default size
      if (!sizeTemplates || sizeTemplates.length === 0) {
        console.log('Server: No size templates found, using default size');
        return getDefaultSize();
      }
      
      console.log('Server: Size templates found:', JSON.stringify(sizeTemplates.slice(0, 2), null, 2), '...');
      
      // Group templates by measure_key
      console.log('Server: Grouping templates by measure_key...');
      const templatesByKey: Record<string, MeasurementTemplate> = {};
      
      for (const template of sizeTemplates) {
        const measureKey = template.fc_cloth_measure_mapping?.measure_key;
        
        if (!measureKey) {
          console.log('Server: Skipping template without measure_key:', template.id);
          continue;
        }
        
        if (!templatesByKey[measureKey]) {
          console.log(`Server: Creating new template group for measure_key: ${measureKey}`);
          templatesByKey[measureKey] = {
            measureKey,
            templates: []
          };
        }
        
        templatesByKey[measureKey].templates.push({
          sizeLabel: template.size_label,
          minValue: template.min_value,
          maxValue: template.max_value,
          priority: template.priority
        });
      }
      
      console.log(`Server: Created ${Object.keys(templatesByKey).length} template groups:`, Object.keys(templatesByKey));
      
      // For each measurement, find the matching size template
      console.log('Server: Processing measurements to find matching size templates...');
      const sizeResults: SizeResult[] = [];
      
      for (const [key, valueStr] of Object.entries(measurements)) {
        console.log(`Server: Processing measurement: ${key} = ${valueStr}`);
        const template = templatesByKey[key];
        
        if (!template) {
          console.log(`Server: No template found for measure_key: ${key}, skipping`);
          continue;
        }
        
        const value = parseInt(valueStr, 10);
        if (isNaN(value)) {
          console.log(`Server: Invalid value for ${key}: ${valueStr}, skipping`);
          continue;
        }
        
        console.log(`Server: Looking for match in ${template.templates.length} templates for ${key}`);
        
        // Detailed debug of templates before matching
        template.templates.forEach((t, index) => {
          console.log(`Server: Template ${index} for ${key}: size=${t.sizeLabel}, range=${t.minValue}-${t.maxValue}, priority=${t.priority}`);
        });
        
        // Sort templates by size for finding smallest/largest when out of range
        const sortedTemplates = [...template.templates].sort((a, b) => a.minValue - b.minValue);
        
        // Find the matching template
        let foundMatch = false;
        for (const t of template.templates) {
          // Debug the comparison operation
          console.log(`Server: Checking if value ${value} is in range [${t.minValue}-${t.maxValue}]`);
          console.log(`Server: Comparison: ${value} >= ${t.minValue} = ${value >= t.minValue}`);
          console.log(`Server: Comparison: ${value} <= ${t.maxValue} = ${value <= t.maxValue}`);
          
          if (value >= t.minValue && value <= t.maxValue) {
            console.log(`Server: Found matching size: ${t.sizeLabel} (priority: ${t.priority}) for ${key}=${value} [range: ${t.minValue}-${t.maxValue}]`);
            sizeResults.push({
              size: t.sizeLabel,
              priority: t.priority
            });
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          console.log(`Server: No matching size range found for ${key}=${value}`);
          
          // Special case: if the value is smaller than the smallest range
          if (sortedTemplates.length > 0) {
            const smallestTemplate = sortedTemplates[0];
            if (value < smallestTemplate.minValue) {
              console.log(`Server: Value ${value} is smaller than smallest range. Using smallest size: ${smallestTemplate.sizeLabel}`);
              sizeResults.push({
                size: smallestTemplate.sizeLabel,
                priority: smallestTemplate.priority
              });
              foundMatch = true;
            }
            // Could also handle case where value is larger than largest range
            else if (value > sortedTemplates[sortedTemplates.length - 1].maxValue) {
              const largestTemplate = sortedTemplates[sortedTemplates.length - 1];
              console.log(`Server: Value ${value} is larger than largest range. Using largest size: ${largestTemplate.sizeLabel}`);
              sizeResults.push({
                size: largestTemplate.sizeLabel,
                priority: largestTemplate.priority
              });
              foundMatch = true;
            }
          }
        }
      }
  
      console.log(`Server: Found ${sizeResults.length} size matches:`, sizeResults);
      
      // If no matches found, use default size
      if (sizeResults.length === 0) {
        console.log('Server: No matching size templates, using default size');
        return getDefaultSize();
      }
  
      // Sort by priority (higher first) and return the highest priority size
      sizeResults.sort((a, b) => b.priority - a.priority);
      console.log(`Server: Final size selected: ${sizeResults[0].size} (priority: ${sizeResults[0].priority})`);
      return sizeResults[0].size;
    } catch (dbError) {
      console.error('Server: Database error when calculating size:', dbError);
      console.error('Server: Error details:', dbError instanceof Error ? dbError.message : String(dbError));
      console.log('Server: Using default size due to database error');
      return getDefaultSize();
    }
    
  } catch (error) {
    console.error('Server: Error calculating size from templates:', error);
    console.error('Server: Error details:', error instanceof Error ? error.message : String(error));
    console.error('Server: Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('Server: Using default size due to error');
    return getDefaultSize();
  }
}
