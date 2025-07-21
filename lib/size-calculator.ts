/**
 * Default size fallback function in case no templates are found.
 * This is used as a backup only.
 */
function getDefaultSize(measurements: Record<string, string>): string {
  // Simply return a medium size as default
  return "M";
}

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

export async function calculateEUSize(clothId: string | number, measurements: Record<string, string>): Promise<string> {
  console.log('calculateEUSize called with clothId:', clothId);
  console.log('Measurements provided:', measurements);
  
  try {
    const clothIdNumber = typeof clothId === 'string' ? parseInt(clothId, 10) : clothId;
    console.log('Converted clothId to number:', clothIdNumber);
    
    if (isNaN(clothIdNumber)) {
      console.error('Invalid clothing ID provided:', clothId);
      return getDefaultSize(measurements);
    }

    // Import the PrismaClient
    console.log('Importing PrismaClient...');
    const { default: prisma } = await import("@/lib/prisma");
    
    try {
      // Get size templates from the database
      console.log('Fetching size templates for cloth ID:', clothIdNumber);
      // Using 'as any' to handle potential schema mismatch between Prisma Client and actual DB
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
      
      console.log(`Found ${sizeTemplates?.length || 0} size templates`);
      
      // If no templates found, use default size
      if (!sizeTemplates || sizeTemplates.length === 0) {
        console.log('No size templates found, using default size');
        return getDefaultSize(measurements);
      }
      
      console.log('Size templates found:', JSON.stringify(sizeTemplates.slice(0, 2), null, 2), '...');
      
      // Group templates by measure_key
      console.log('Grouping templates by measure_key...');
      const templatesByKey: Record<string, MeasurementTemplate> = {};
      
      for (const template of sizeTemplates) {
        const measureKey = template.fc_cloth_measure_mapping?.measure_key;
        
        if (!measureKey) {
          console.log('Skipping template without measure_key:', template.id);
          continue;
        }
        
        if (!templatesByKey[measureKey]) {
          console.log(`Creating new template group for measure_key: ${measureKey}`);
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
      
      console.log(`Created ${Object.keys(templatesByKey).length} template groups:`, Object.keys(templatesByKey));
      
      // For each measurement, find the matching size template
      console.log('Processing measurements to find matching size templates...');
      const sizeResults: SizeResult[] = [];
      
      for (const [key, valueStr] of Object.entries(measurements)) {
        console.log(`Processing measurement: ${key} = ${valueStr}`);
        const template = templatesByKey[key];
        
        if (!template) {
          console.log(`No template found for measure_key: ${key}, skipping`);
          continue;
        }
        
        const value = parseInt(valueStr, 10);
        if (isNaN(value)) {
          console.log(`Invalid value for ${key}: ${valueStr}, skipping`);
          continue;
        }
        
        console.log(`Looking for match in ${template.templates.length} templates for ${key}`);
        // Find the matching template
        let foundMatch = false;
        for (const t of template.templates) {
          if (value >= t.minValue && value <= t.maxValue) {
            console.log(`Found matching size: ${t.sizeLabel} (priority: ${t.priority}) for ${key}=${value} [range: ${t.minValue}-${t.maxValue}]`);
            sizeResults.push({
              size: t.sizeLabel,
              priority: t.priority
            });
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          console.log(`No matching size range found for ${key}=${value}`);
        }
      }
  
      console.log(`Found ${sizeResults.length} size matches:`, sizeResults);
      
      // If no matches found, use default size
      if (sizeResults.length === 0) {
        console.log('No matching size templates, using default size');
        return getDefaultSize(measurements);
      }
  
      // Sort by priority (higher first) and return the highest priority size
      sizeResults.sort((a, b) => b.priority - a.priority);
      console.log(`Final size selected: ${sizeResults[0].size} (priority: ${sizeResults[0].priority})`);
      return sizeResults[0].size;
    } catch (dbError) {
      console.error('Database error when calculating size:', dbError);
      console.error('Error details:', dbError instanceof Error ? dbError.message : String(dbError));
      console.log('Using default size due to database error');
      return getDefaultSize(measurements);
    }
    
  } catch (error) {
    console.error('Error calculating size from templates:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('Using default size due to error');
    return getDefaultSize(measurements);
  }
}
