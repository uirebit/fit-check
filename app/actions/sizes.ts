"use server"

interface SavedSize {
  id: string
  clothingType: string
  clothingName: string
  measurements: Record<string, string>
  calculatedSize: string
  savedAt: string
}

// Initial mock data - will be used only if no sizes are found in localStorage
const initialMockSavedSizes: SavedSize[] = [
  {
    id: "1",
    clothingType: "workShirt",
    clothingName: "Work Shirt",
    measurements: {
      chestCircumference: "102",
      neckCircumference: "40",
      sleeveLength: "65",
    },
    calculatedSize: "M",
    savedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    clothingType: "workBoots",
    clothingName: "Work Boots",
    measurements: {
      footLength: "27",
      footWidth: "10",
    },
    calculatedSize: "42",
    savedAt: "2024-01-10T14:20:00Z",
  },
]

interface SizeState {
  success?: boolean
  error?: string
  message?: string
}

// Helper function to get saved sizes from localStorage
const getSavedSizesFromStorage = (): SavedSize[] => {
  if (typeof window === 'undefined') {
    return initialMockSavedSizes;
  }
  
  const storedSizes = localStorage.getItem('savedSizes');
  if (!storedSizes) {
    // Initialize with mock data if nothing is in storage
    localStorage.setItem('savedSizes', JSON.stringify(initialMockSavedSizes));
    return initialMockSavedSizes;
  }
  
  try {
    return JSON.parse(storedSizes);
  } catch (error) {
    console.error('Error parsing saved sizes from localStorage:', error);
    return initialMockSavedSizes;
  }
}

// Helper function to save sizes to localStorage
const saveSizesToStorage = (sizes: SavedSize[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('savedSizes', JSON.stringify(sizes));
  }
}

export async function saveMeasurement(prevState: SizeState | null, formData: FormData): Promise<SizeState> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

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

  // Get current saved sizes
  const savedSizes = getSavedSizesFromStorage();
  
  // Check if this clothing type already exists for the user
  const existingIndex = savedSizes.findIndex((size) => size.clothingType === clothingType);

  const newSize: SavedSize = {
    id: existingIndex >= 0 ? savedSizes[existingIndex].id : Date.now().toString(),
    clothingType,
    clothingName,
    measurements,
    calculatedSize,
    savedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    // Update existing
    savedSizes[existingIndex] = newSize;
  } else {
    // Add new
    savedSizes.push(newSize);
  }

  // Save to localStorage
  saveSizesToStorage(savedSizes);

  return {
    success: true,
    message: `${clothingName} size information saved successfully! Your size is ${calculatedSize}.`,
  };
}

export async function getSavedSizes(): Promise<SavedSize[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const savedSizes = getSavedSizesFromStorage();
  return [...savedSizes].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export async function deleteSavedSize(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const savedSizes = getSavedSizesFromStorage();
  const updatedSizes = savedSizes.filter((size) => size.id !== id);
  saveSizesToStorage(updatedSizes);
}
