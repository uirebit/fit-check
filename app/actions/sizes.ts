"use server"

interface SavedSize {
  id: string
  clothingType: string
  clothingName: string
  measurements: Record<string, string>
  calculatedSize: string
  savedAt: string
}

// Mock database - in production, use a real database
let mockSavedSizes: SavedSize[] = [
  {
    id: "1",
    clothingType: "work-shirt",
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
    clothingType: "work-boots",
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

export async function saveMeasurement(prevState: SizeState | null, formData: FormData): Promise<SizeState> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const clothingType = formData.get("clothingType") as string
  const clothingName = formData.get("clothingName") as string
  const calculatedSize = formData.get("calculatedSize") as string

  if (!clothingType || !clothingName || !calculatedSize) {
    return {
      success: false,
      error: "Missing required information",
    }
  }

  // Extract measurements from form data
  const measurements: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key !== "clothingType" && key !== "clothingName" && key !== "calculatedSize") {
      measurements[key] = value as string
    }
  }

  if (Object.keys(measurements).length === 0) {
    return {
      success: false,
      error: "No measurements provided",
    }
  }

  // Check if this clothing type already exists for the user
  const existingIndex = mockSavedSizes.findIndex((size) => size.clothingType === clothingType)

  const newSize: SavedSize = {
    id: existingIndex >= 0 ? mockSavedSizes[existingIndex].id : Date.now().toString(),
    clothingType,
    clothingName,
    measurements,
    calculatedSize,
    savedAt: new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    // Update existing
    mockSavedSizes[existingIndex] = newSize
  } else {
    // Add new
    mockSavedSizes.push(newSize)
  }

  return {
    success: true,
    message: `${clothingName} size information saved successfully! Your size is ${calculatedSize}.`,
  }
}

export async function getSavedSizes(): Promise<SavedSize[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...mockSavedSizes].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
}

export async function deleteSavedSize(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  mockSavedSizes = mockSavedSizes.filter((size) => size.id !== id)
}
