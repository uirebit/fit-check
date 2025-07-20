"use server"

interface SavedSize {
  id: string
  clothingType: string
  clothingName: string
  measurements: Record<string, string>
  calculatedSize: string
  savedAt: string
}

interface SizeState {
  success?: boolean
  error?: string
  message?: string
  clothingName?: string
  calculatedSize?: string
}

type MeasurementValue = {
  measurement_id: number;
  measure_number: number;
  measure_value: number | null;
};

export async function saveMeasurement(prevState: SizeState | null, formData: FormData): Promise<SizeState> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Log the form data for debugging
    console.log("Form data received:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const clothingType = formData.get("clothingType") as string;
    const clothingName = formData.get("clothingName") as string;
    const calculatedSize = formData.get("calculatedSize") as string;

    if (!clothingType || !clothingName || !calculatedSize) {
      return {
        success: false,
        error: "Missing required information",
      };
    }

    // Extract measurements from form data
    const measurements: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "clothingType" && key !== "clothingName" && key !== "calculatedSize") {
        measurements[key] = value as string;
      }
    }

    if (Object.keys(measurements).length === 0) {
      return {
        success: false,
        error: "No measurements provided",
      };
    }

    // We'll only save to the database, not localStorage
    
    // Save to the database
    try {
      // Primero intentamos obtener la sesión de NextAuth (será implementado en el futuro)
      const { default: prisma } = await import("@/lib/prisma");
      
      // Obtener el email del usuario exclusivamente de la sesión NextAuth
      let userEmail = "";
      
      try {
        // Obtener la sesión de NextAuth
        const authFile = await import("@/auth");
        
        // Obtener la sesión actual
        const session = await authFile.auth();
        
        if (session && session.user?.email) {
          userEmail = session.user.email;
          console.log("Found user email in NextAuth session:", userEmail);
        } else {
          console.error("No user email found in NextAuth session");
          return {
            success: false,
            error: "User not authenticated. Please log in again."
          };
        }
      } catch (authError) {
        console.error("Error accessing NextAuth session:", authError);
        return {
          success: false,
          error: "Authentication error. Please log in again."
        };
      }
      
      // 1. Get the user from the database
      const user = await prisma.fc_user.findUnique({
        where: { email: userEmail }
      });
      
      if (!user) {
        console.error("User not found in database for email:", userEmail);
        return {
          success: false,
          error: "User not found in database. Please ensure you're properly logged in."
        };
      }
      
      // 2. Create a new measurement record in fc_cloth_measurements
      const clothIdNumber = parseInt(clothingType, 10);
      
      // Validate that the ID is valid
      if (isNaN(clothIdNumber)) {
        console.error("Invalid clothing ID, not a number:", clothingType);
        return {
          success: false,
          error: "Invalid clothing ID"
        };
      }
      
      console.log(`Processing save for user ${user.id}, clothing ID: ${clothIdNumber}`);
      
      // Check if the cloth exists
      const clothExists = await prisma.fc_cloth.findUnique({
        where: {
          id: clothIdNumber
        }
      });
      
      if (!clothExists) {
        console.error("Clothing item not found:", clothIdNumber);
        return {
          success: false,
          error: "Clothing item not found"
        };
      }
      
      // Check if the user already has a measurement for this cloth type
      const existingMeasurement = await prisma.fc_cloth_measurements.findFirst({
        where: {
          user_id: user.id,
          cloth_id: clothIdNumber
        }
      });
      
      let measurementRecord;
      
      if (existingMeasurement) {
        // Update the existing measurement
        measurementRecord = await prisma.fc_cloth_measurements.update({
          where: { id: existingMeasurement.id },
          data: {
            calculated_size: calculatedSize
          }
        });
        
        // Delete existing measurement values
        await prisma.fc_cloth_measurement_value.deleteMany({
          where: { measurement_id: measurementRecord.id }
        });
      } else {
        try {
          // Create a new measurement
          console.log(`Creating new measurement record for user ${user.id}, cloth ${clothIdNumber}`);
          measurementRecord = await prisma.fc_cloth_measurements.create({
            data: {
              user_id: user.id,
              cloth_id: clothIdNumber,
              calculated_size: calculatedSize,
              created_at: new Date()
            }
          });
          console.log(`Created new measurement record with ID: ${measurementRecord.id}`);
        } catch (createError) {
          console.error("Failed to create measurement record:", createError);
          return {
            success: false,
            error: "Failed to create measurement record"
          };
        }
      }
      
      // 3. Get the measure mappings for this clothing type
      const measureMappings = await prisma.fc_cloth_measure_mapping.findMany({
        where: {
          cloth_id: clothIdNumber
        },
        orderBy: {
          measure_number: 'asc'
        }
      });
      
      console.log("Retrieved measure mappings:", measureMappings);
      console.log("User measurements:", measurements);
      
      // 4. Create measurement value records for each mapping
      const measurementValues = [];
      
      for (const mapping of measureMappings) {
        if (!mapping.measure_key || mapping.measure_number === null) {
          console.warn("Skipping invalid mapping:", mapping);
          continue;
        }
        
        const measureKey = mapping.measure_key;
        const measureValue = measurements[measureKey];
        
        if (!measureValue) {
          console.warn(`No measurement value found for key: ${measureKey}`);
          continue;
        }
        
        // Convert to integer (assuming measurements are in whole numbers)
        const intValue = Math.round(parseFloat(measureValue));
        if (isNaN(intValue)) {
          console.warn(`Invalid numeric value for ${measureKey}: ${measureValue}`);
          continue;
        }
        
        console.log(`Creating measurement value: key=${measureKey}, number=${mapping.measure_number}, value=${intValue}`);
        
        // Create the measurement value record
        const measurementValue = await prisma.fc_cloth_measurement_value.create({
          data: {
            measurement_id: measurementRecord.id,
            measure_number: mapping.measure_number,
            measure_value: intValue
          }
        });
        
        measurementValues.push(measurementValue);
      }
      
      console.log(`Created ${measurementValues.length} measurement values for measurement ID ${measurementRecord.id}`);
      
      
      console.log(`Measurements saved to database for user ${user.id} and cloth ${clothingType}`);
    } catch (dbError) {
      console.error("Error saving to database:", dbError);
      return {
        success: false,
        error: "Error saving to database. Please try again."
      };
    }

    return {
      success: true,
      message: "sizeSaved"
    };
  } catch (error) {
    console.error("Error in saveMeasurement:", error);
    return {
      success: false,
      error: "An unexpected error occurred"
    };
  }
}

export async function getSavedSizes(): Promise<SavedSize[]> {
  try {
    // Obtener el email exclusivamente de la sesión de NextAuth
    let userEmail = "";
    
    try {
      // Import auth from the root auth.ts file
      const authFile = await import("@/auth");
      const session = await authFile.auth();
      
      if (session?.user?.email) {
        userEmail = session.user.email;
        console.log("Found user email in NextAuth session:", userEmail);
      } else {
        console.warn("No user email found in NextAuth session");
        return [];
      }
    } catch (authError) {
      console.error("Error accessing NextAuth session:", authError);
      return [];
    }
    
    const { default: prisma } = await import("@/lib/prisma");
    
    // Get the user from the database
    const user = await prisma.fc_user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.error("User not found in database");
      return [];
    }
    
    // Get all saved measurements for this user
    const savedMeasurements = await prisma.fc_cloth_measurements.findMany({
      where: {
        user_id: user.id
      },
      include: {
        fc_cloth: true,
        fc_cloth_measurement_value: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // For each measurement, get the mappings to translate measure_number to measure_key
    const savedSizes: SavedSize[] = [];
    
    for (const measurement of savedMeasurements) {
      // Get the mappings for this clothing type
      const mappings = await prisma.fc_cloth_measure_mapping.findMany({
        where: {
          cloth_id: measurement.cloth_id
        }
      });
      
      // Build the measurements object      
      const measurementsObj: Record<string, string> = {};
      
      measurement.fc_cloth_measurement_value.forEach((value: MeasurementValue) => {
      const mapping = mappings.find((m: { measure_number: number; measure_key?: string }) => m.measure_number === value.measure_number);
        if (mapping?.measure_key) {
          // Ensure the value is always a string and never undefined/null
          const measureValue = value.measure_value;
          measurementsObj[mapping.measure_key] = measureValue !== null && measureValue !== undefined 
            ? String(measureValue) 
            : '';
        }
      });
      
      savedSizes.push({
        id: measurement.id.toString(),
        clothingType: measurement.cloth_id.toString(),
        clothingName: measurement.fc_cloth.description || 'Unknown',
        // Asegúrate de que clothingName sea la clave para las traducciones
        measurements: measurementsObj,
        calculatedSize: measurement.calculated_size || '',
        savedAt: measurement.created_at?.toISOString() || new Date().toISOString()
      });
    }
    
    return savedSizes;
    
  } catch (error) {
    console.error("Error fetching saved sizes from database:", error);
    return [];
  }
}

export async function deleteSavedSize(id: string): Promise<void> {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    
    const measurementId = parseInt(id, 10);
    if (isNaN(measurementId)) {
      throw new Error(`Invalid measurement ID: ${id}`);
    }
    
    // First delete the measurement values
    await prisma.fc_cloth_measurement_value.deleteMany({
      where: {
        measurement_id: measurementId
      }
    });
    
    // Then delete the measurement record
    await prisma.fc_cloth_measurements.delete({
      where: {
        id: measurementId
      }
    });
    
    console.log(`Successfully deleted saved size with ID: ${id}`);
    
  } catch (error) {
    console.error(`Failed to delete saved size with ID: ${id}`, error);
    throw new Error(`Failed to delete saved size: ${error instanceof Error ? error.message : String(error)}`);
  }
}
