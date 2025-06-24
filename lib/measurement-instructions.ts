interface MeasurementField {
  field: string
  label: string
  placeholder: string
  description: string
}

interface MeasurementInstructions {
  imageUrl: string
  instructions: string[]
  measurements: MeasurementField[]
}

export function getMeasurementInstructions(clothingType: string, gender: "male" | "female"): MeasurementInstructions {
  const baseImageUrl = `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(`${clothingType}-${gender}`)}`

  const instructionsMap: Record<string, MeasurementInstructions> = {
    "work-hat": {
      imageUrl: baseImageUrl,
      instructions: [
        "Wrap a flexible measuring tape around your head, about 1 inch above your eyebrows",
        "Keep the tape level and snug but not tight",
        "Record the measurement where the tape meets",
      ],
      measurements: [
        {
          field: "headCircumference",
          label: "Head Circumference",
          placeholder: "Enter head circumference",
          description: "Measure around the widest part of your head",
        },
      ],
    },
    "safety-helmet": {
      imageUrl: baseImageUrl,
      instructions: [
        "Measure around your head at the widest point",
        "Position the tape about 1 inch above your eyebrows",
        "Ensure the tape is level all around your head",
      ],
      measurements: [
        {
          field: "headCircumference",
          label: "Head Circumference",
          placeholder: "Enter head circumference",
          description: "Measure around the widest part of your head",
        },
      ],
    },
    "work-shirt": {
      imageUrl: baseImageUrl,
      instructions: [
        "Measure chest at the fullest part, under the arms",
        "Measure neck circumference at the base",
        "Measure sleeve length from shoulder to wrist",
        "Keep the tape snug but not tight",
      ],
      measurements: [
        {
          field: "chestCircumference",
          label: "Chest Circumference",
          placeholder: "Enter chest measurement",
          description: "Measure around the fullest part of your chest",
        },
        {
          field: "neckCircumference",
          label: "Neck Circumference",
          placeholder: "Enter neck measurement",
          description: "Measure around the base of your neck",
        },
        {
          field: "sleeveLength",
          label: "Sleeve Length",
          placeholder: "Enter sleeve length",
          description: "From shoulder point to wrist",
        },
      ],
    },
    "polo-shirt": {
      imageUrl: baseImageUrl,
      instructions: [
        "Measure chest at the fullest part, under the arms",
        "Measure neck circumference at the base",
        "Measure sleeve length from shoulder to wrist",
        "Keep the tape snug but not tight",
      ],
      measurements: [
        {
          field: "chestCircumference",
          label: "Chest Circumference",
          placeholder: "Enter chest measurement",
          description: "Measure around the fullest part of your chest",
        },
        {
          field: "neckCircumference",
          label: "Neck Circumference",
          placeholder: "Enter neck measurement",
          description: "Measure around the base of your neck",
        },
        {
          field: "sleeveLength",
          label: "Sleeve Length",
          placeholder: "Enter sleeve length",
          description: "From shoulder point to wrist",
        },
      ],
    },
    "work-pants": {
      imageUrl: baseImageUrl,
      instructions: [
        "Measure waist at the narrowest point",
        "Measure hips at the fullest part",
        "Measure inseam from crotch to ankle",
        "Stand straight with feet slightly apart",
      ],
      measurements: [
        {
          field: "waistCircumference",
          label: "Waist Circumference",
          placeholder: "Enter waist measurement",
          description: "Measure around your natural waistline",
        },
        {
          field: "hipCircumference",
          label: "Hip Circumference",
          placeholder: "Enter hip measurement",
          description: "Measure around the fullest part of your hips",
        },
        {
          field: "inseamLength",
          label: "Inseam Length",
          placeholder: "Enter inseam length",
          description: "From crotch to ankle bone",
        },
      ],
    },
    "work-shorts": {
      imageUrl: baseImageUrl,
      instructions: [
        "Measure waist at the narrowest point",
        "Measure hips at the fullest part",
        "Measure desired short length from waist",
        "Stand straight with feet slightly apart",
      ],
      measurements: [
        {
          field: "waistCircumference",
          label: "Waist Circumference",
          placeholder: "Enter waist measurement",
          description: "Measure around your natural waistline",
        },
        {
          field: "hipCircumference",
          label: "Hip Circumference",
          placeholder: "Enter hip measurement",
          description: "Measure around the fullest part of your hips",
        },
      ],
    },
    "work-boots": {
      imageUrl: baseImageUrl,
      instructions: [
        "Measure foot length from heel to longest toe",
        "Measure foot width at the widest point",
        "Measure while standing with weight on both feet",
        "Measure both feet and use the larger measurement",
      ],
      measurements: [
        {
          field: "footLength",
          label: "Foot Length",
          placeholder: "Enter foot length",
          description: "From heel to longest toe",
        },
        {
          field: "footWidth",
          label: "Foot Width",
          placeholder: "Enter foot width",
          description: "At the widest part of your foot",
        },
      ],
    },
    "safety-shoes": {
      imageUrl: baseImageUrl,
      instructions: [
        "Measure foot length from heel to longest toe",
        "Measure foot width at the widest point",
        "Measure while standing with weight on both feet",
        "Measure both feet and use the larger measurement",
      ],
      measurements: [
        {
          field: "footLength",
          label: "Foot Length",
          placeholder: "Enter foot length",
          description: "From heel to longest toe",
        },
        {
          field: "footWidth",
          label: "Foot Width",
          placeholder: "Enter foot width",
          description: "At the widest part of your foot",
        },
      ],
    },
  }

  // Return default measurements for clothing types not specifically defined
  return (
    instructionsMap[clothingType] || {
      imageUrl: baseImageUrl,
      instructions: [
        "Follow the general measurement guidelines",
        "Use a flexible measuring tape",
        "Keep measurements snug but not tight",
        "Ask for assistance if needed",
      ],
      measurements: [
        {
          field: "measurement1",
          label: "Primary Measurement",
          placeholder: "Enter measurement",
          description: "Main measurement for this clothing type",
        },
      ],
    }
  )
}
