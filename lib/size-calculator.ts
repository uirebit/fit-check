export function calculateEUSize(clothingType: string, measurements: Record<string, string>): string {
  const sizeCalculators: Record<string, (measurements: Record<string, string>) => string> = {
    "work-hat": (m) => {
      const head = Number.parseInt(m.headCircumference)
      if (head <= 54) return "XS"
      if (head <= 56) return "S"
      if (head <= 58) return "M"
      if (head <= 60) return "L"
      if (head <= 62) return "XL"
      return "XXL"
    },

    "safety-helmet": (m) => {
      const head = Number.parseInt(m.headCircumference)
      if (head <= 54) return "XS"
      if (head <= 56) return "S"
      if (head <= 58) return "M"
      if (head <= 60) return "L"
      if (head <= 62) return "XL"
      return "XXL"
    },

    "work-shirt": (m) => {
      const chest = Number.parseInt(m.chestCircumference)
      if (chest <= 88) return "XS"
      if (chest <= 96) return "S"
      if (chest <= 104) return "M"
      if (chest <= 112) return "L"
      if (chest <= 120) return "XL"
      if (chest <= 128) return "XXL"
      return "XXXL"
    },

    "polo-shirt": (m) => {
      const chest = Number.parseInt(m.chestCircumference)
      if (chest <= 88) return "XS"
      if (chest <= 96) return "S"
      if (chest <= 104) return "M"
      if (chest <= 112) return "L"
      if (chest <= 120) return "XL"
      if (chest <= 128) return "XXL"
      return "XXXL"
    },

    "work-pants": (m) => {
      const waist = Number.parseInt(m.waistCircumference)
      if (waist <= 76) return "XS"
      if (waist <= 84) return "S"
      if (waist <= 92) return "M"
      if (waist <= 100) return "L"
      if (waist <= 108) return "XL"
      if (waist <= 116) return "XXL"
      return "XXXL"
    },

    "work-shorts": (m) => {
      const waist = Number.parseInt(m.waistCircumference)
      if (waist <= 76) return "XS"
      if (waist <= 84) return "S"
      if (waist <= 92) return "M"
      if (waist <= 100) return "L"
      if (waist <= 108) return "XL"
      if (waist <= 116) return "XXL"
      return "XXXL"
    },

    "work-boots": (m) => {
      const length = Number.parseInt(m.footLength)
      // EU shoe sizes based on foot length in cm
      if (length <= 22.5) return "35"
      if (length <= 23) return "36"
      if (length <= 23.5) return "37"
      if (length <= 24.5) return "38"
      if (length <= 25) return "39"
      if (length <= 25.5) return "40"
      if (length <= 26.5) return "41"
      if (length <= 27) return "42"
      if (length <= 27.5) return "43"
      if (length <= 28.5) return "44"
      if (length <= 29) return "45"
      if (length <= 29.5) return "46"
      if (length <= 30.5) return "47"
      return "48"
    },

    "safety-shoes": (m) => {
      const length = Number.parseInt(m.footLength)
      if (length <= 22.5) return "35"
      if (length <= 23) return "36"
      if (length <= 23.5) return "37"
      if (length <= 24.5) return "38"
      if (length <= 25) return "39"
      if (length <= 25.5) return "40"
      if (length <= 26.5) return "41"
      if (length <= 27) return "42"
      if (length <= 27.5) return "43"
      if (length <= 28.5) return "44"
      if (length <= 29) return "45"
      if (length <= 29.5) return "46"
      if (length <= 30.5) return "47"
      return "48"
    },
  }

  const calculator = sizeCalculators[clothingType]
  if (calculator) {
    return calculator(measurements)
  }

  // Default size calculation for undefined clothing types
  const firstMeasurement = Object.values(measurements)[0]
  const value = Number.parseInt(firstMeasurement)
  if (value <= 80) return "XS"
  if (value <= 90) return "S"
  if (value <= 100) return "M"
  if (value <= 110) return "L"
  if (value <= 120) return "XL"
  return "XXL"
}
