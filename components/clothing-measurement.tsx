"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { saveMeasurement } from "@/app/actions/sizes"
import { calculateEUSize } from "@/lib/size-calculator"
import { getMeasurementInstructions } from "@/lib/measurement-instructions"
import { Loader2, Save, Ruler } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface ClothingMeasurementProps {
  clothingType: string
  clothingName: string
  userGender: "male" | "female"
}

export function ClothingMeasurement({ clothingType, clothingName, userGender }: ClothingMeasurementProps) {
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [calculatedSize, setCalculatedSize] = useState<string>("")
  const [state, action, isPending] = useActionState(saveMeasurement, null)
  const { t } = useLanguage()

  const instructions = getMeasurementInstructions(clothingType, userGender)

  // Clear form when component mounts (clothing type changes)
  useEffect(() => {
    setMeasurements({})
    setCalculatedSize("")
  }, [clothingType])

  const handleMeasurementChange = (field: string, value: string) => {
    const newMeasurements = { ...measurements, [field]: value }
    setMeasurements(newMeasurements)

    // Calculate EU size when all required measurements are filled
    const allFieldsFilled = instructions.measurements.every(
      (m) => newMeasurements[m.field] && newMeasurements[m.field] !== "",
    )

    if (allFieldsFilled) {
      const size = calculateEUSize(clothingType, newMeasurements)
      setCalculatedSize(size)
    } else {
      setCalculatedSize("")
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Measurement Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ruler className="h-5 w-5 mr-2 text-green-600" />
            {t("measurement.howToMeasure")}: {clothingName && t(clothingName)}
          </CardTitle>
          <CardDescription>{t("measurement.followInstructions")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Measurement Image */}
          <div className="relative">
            <img
              src={instructions.imageUrl || "/placeholder.svg"}
              alt={`${t("measurement.howToMeasure")} ${clothingName && t(clothingName)} ${userGender}`}
              className="w-full h-64 object-contain bg-gray-50 rounded-lg border"
            />
            <Badge className="absolute top-2 right-2" variant="secondary">
              {userGender === "male" ? t("measurement.maleGuide") : t("measurement.femaleGuide")}
            </Badge>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">{t("measurement.instructions")}</h4>
            <ul className="space-y-2">
              {instructions.instructions.map((instruction, index) => {
                // Check if the instruction has a translation key
                const instructionKey = `measure.instruction.${clothingType}.${index+1}`;
                const translatedInstruction = t(instructionKey);
                // If no translation is found, use the original instruction
                const displayText = translatedInstruction === instructionKey ? instruction : translatedInstruction;
                
                return (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{displayText}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">{t("measurement.tips")}</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>{t("measurement.tip1")}</li>
              <li>{t("measurement.tip2")}</li>
              <li>{t("measurement.tip3")}</li>
              <li>{t("measurement.tip4")}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Measurement Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Save className="h-5 w-5 mr-2 text-purple-600" />
            {t("input.enterMeasurements")}
          </CardTitle>
          <CardDescription>{t("input.enterInCm")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <input type="hidden" name="clothingType" value={clothingType} />
            <input type="hidden" name="clothingName" value={clothingName} />
            <input type="hidden" name="calculatedSize" value={calculatedSize} />

            {instructions.measurements.map((measurement) => (
              <div key={measurement.field} className="space-y-2">
                <Label htmlFor={measurement.field}>
                  {t(`measure.${measurement.field}`) || measurement.label}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id={measurement.field}
                    name={measurement.field}
                    type="number"
                    placeholder={t(`measure.${measurement.field}Placeholder`) || measurement.placeholder}
                    value={measurements[measurement.field] || ""}
                    onChange={(e) => handleMeasurementChange(measurement.field, e.target.value)}
                    required
                    disabled={isPending}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">cm</span>
                </div>
                <p className="text-xs text-gray-500">{t(`measure.${measurement.field}Desc`) || measurement.description}</p>
              </div>
            ))}

            {/* Calculated Size Display */}
            {calculatedSize && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">{t("input.calculatedSize")}</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {calculatedSize}
                  </Badge>
                  <span className="text-sm text-green-700">{t("input.basedOnMeasurements")}</span>
                </div>
              </div>
            )}

            {state?.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {state?.success && (
              <Alert>
                <AlertDescription className="text-green-600">{state.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending || !calculatedSize}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("input.saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("input.save")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
