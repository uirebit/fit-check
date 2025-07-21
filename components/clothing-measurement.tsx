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
import { calculateSizeFromServer } from "@/app/actions/sizes-calculation"
import { getMeasurementInstructions } from "@/lib/measurement-instructions"
import { Loader2, Save, Ruler } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"

interface ClothingMeasurementProps {
  clothingType: string
  clothingName: string
  userGender: "male" | "female"
}

export function ClothingMeasurement({ clothingType, clothingName, userGender }: ClothingMeasurementProps) {
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [calculatedSize, setCalculatedSize] = useState<string>("")
  const [state, action, isPending] = useActionState(saveMeasurement, null)
  const [loading, setLoading] = useState(true)
  const [measureFields, setMeasureFields] = useState<any[]>([])
  const [loadingSavedData, setLoadingSavedData] = useState(false)
  const [hasSavedData, setHasSavedData] = useState(false)
  const { t } = useLanguage()
  const { user, isAuthenticated } = useAuth()

  // First get the static instructions
  const instructions = getMeasurementInstructions(clothingType, userGender)
  
  // Get the normalized clothing type to use for instruction translations
  const normalizedClothingType = clothingType.replace(/_/g, '-');

  // Track whether the effect has already been run for this clothing type
  const [effectRan, setEffectRan] = useState<string | null>(null);
  
  // Clear form and fetch measure mappings when clothing type changes
  useEffect(() => {
    // Skip if we've already run this effect for the current clothing type
    // This prevents infinite loops by ensuring the effect only runs once per clothing type
    if (effectRan === clothingType) {
      return;
    }

    console.log(`Loading data for clothing type: ${clothingType}`);
    
    // DEBUG: Direct test of size calculation with the ID
    const debugTest = async () => {
      try {
        console.log("DEBUG: Testing size calculation directly with ID:", clothingType);
        
        // Test with sample measurements
        const testMeasurements = {
          "chest": "100",
          "waist": "90", 
          "hips": "105"
        };
        
        // First check if templates exist in the database
        const { debugGetTemplates } = await import("@/app/actions/debug");
        const templatesDebugResult = await debugGetTemplates(clothingType);
        console.log("DEBUG: Templates check result:", templatesDebugResult);
        
        // Then test the size calculation
        const size = await calculateSizeFromServer(clothingType, testMeasurements);
        console.log("DEBUG: Direct test result:", size);
      } catch (err) {
        console.error("DEBUG: Direct test error:", err);
      }
    };
    
    debugTest();
    
    // Mark that we're running the effect for this clothing type
    setEffectRan(clothingType);
    
    // Reset state
    setMeasurements({});
    setCalculatedSize("");
    setLoading(true);
    setHasSavedData(false);
    
    // Define a function to load all data in sequence
    const loadData = async () => {
      try {
        // Step 1: Import the necessary functions
        const { getClothingMeasureMappings, getUserMeasurements } = await import("@/app/actions/clothing");
        
        // Step 2: Get the clothing measure mappings
        const mappings = await getClothingMeasureMappings(clothingType);
        
        // Step 3: Set up the measurement fields
        if (mappings && mappings.length > 0) {
          const fields = mappings.map(mapping => ({
            field: mapping.measure_key,
            label: t(`measure.${mapping.measure_key}`) || mapping.measure_key,
            placeholder: t(`measure.${mapping.measure_key}Placeholder`) || `Enter ${mapping.measure_key}`,
            description: t(`measure.${mapping.measure_key}Desc`) || `Measurement #${mapping.measure_number}`,
            measure_number: mapping.measure_number
          }));
          setMeasureFields(fields);
        } else {
          // If no mappings found, use the static instructions as fallback
          setMeasureFields(instructions.measurements);
        }
        
        // Step 4: Mark loading of fields as complete
        setLoading(false);
        
        // Step 5: Only load saved measurements if authenticated
        if (isAuthenticated && user?.email) {
          setLoadingSavedData(true);
          
          // Step 6: Get user's saved measurements for this clothing type
          const savedMeasurement = await getUserMeasurements(clothingType);
          
          if (savedMeasurement && savedMeasurement.values.length > 0) {
            // Convert saved values to the format used by the form
            const savedValues: Record<string, string> = {};
            savedMeasurement.values.forEach(value => {
              if (value.measure_key && value.measure_value !== undefined) {
                savedValues[value.measure_key] = value.measure_value.toString();
              }
            });
            
            // Batch state updates to minimize re-renders
            setMeasurements(savedValues);
            setHasSavedData(true);
            
            // Calculate size based on the saved measurements using server action
            calculateSizeFromServer(clothingType, savedValues)
              .then((size: string) => setCalculatedSize(size))
              .catch((err: Error) => {
                console.error("Error calculating size:", err);
                setCalculatedSize("");
              });
          }
          
          // Step 7: Mark loading of saved data as complete
          setLoadingSavedData(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // Use the static instructions as fallback
        setMeasureFields(instructions.measurements);
        setLoading(false);
        setLoadingSavedData(false);
      }
    };
    
    // Execute the data loading function
    loadData();
    
  // Only depend on clothingType to prevent unnecessary re-renders
  // Instructions are stable and don't change, so we don't need them in deps
  }, [clothingType])

  const handleMeasurementChange = (field: string, value: string) => {
    // Update measurements object with new value
    const newMeasurements = { ...measurements, [field]: value };
    setMeasurements(newMeasurements);

    // Use a slight delay for size calculation to avoid excessive recalculations
    // during rapid input changes
    const timer = setTimeout(() => {
      // Check if all required fields are filled
      const allFieldsFilled = measureFields.every(
        (m) => newMeasurements[m.field] && newMeasurements[m.field] !== "",
      );

      if (allFieldsFilled) {
        // Calculate size only when all fields are filled using server action
        console.log("All fields filled, calculating size for:", clothingType);
        console.log("Measurements being sent to calculation:", JSON.stringify(newMeasurements));
        
        calculateSizeFromServer(clothingType, newMeasurements)
          .then((size: string) => {
            console.log("Size calculation result:", size);
            setCalculatedSize(size);
          })
          .catch((err: Error) => {
            console.error("Error calculating size:", err);
            setCalculatedSize("");
          });
      } else {
        // Clear calculated size if not all fields are filled
        console.log("Not all required measurement fields are filled");
        setCalculatedSize("");
      }
    }, 100); // 100ms delay to debounce multiple rapid changes

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }

  // Verificar si el usuario está autenticado con NextAuth
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {t("error.authRequired") || "You need to be logged in to access this feature. Please sign in to continue."}
          </AlertDescription>
        </Alert>
        <Button 
          variant="link" 
          className="mt-4"
          onClick={() => window.location.href = `/${t("locale") || "en"}/login`}
        >
          {t("login.goToLogin") || "Go to login page"}
        </Button>
      </div>
    );
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
                // First try with the specific clothing type key
                const specificInstructionKey = `measure.instruction.${normalizedClothingType}.${index+1}`;
                let translatedInstruction = t(specificInstructionKey);
                
                // If no specific translation is found, try with the default instructions
                if (translatedInstruction === specificInstructionKey) {
                  const defaultInstructionKey = `measure.instruction.default.${index+1}`;
                  translatedInstruction = t(defaultInstructionKey);
                  
                  // If still no translation found, use the original instruction
                  if (translatedInstruction === defaultInstructionKey) {
                    translatedInstruction = instruction;
                  }
                }
                
                return (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{translatedInstruction}</span>
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
            
            {/* No necesitamos campos ocultos para la autenticación, ya que usamos NextAuth */}

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
                <span className="ml-2">{t("loading.measurements")}</span>
              </div>
            ) : loadingSavedData ? (
              <div className="flex justify-center items-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <span className="ml-2">{t("loading.savedMeasurements")}</span>
              </div>
            ) : measureFields.length === 0 ? (
              <Alert>
                <AlertDescription>{t("error.noMeasurementFields")}</AlertDescription>
              </Alert>
            ) : (
              measureFields.map((measurement) => (
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
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">{t("input.centimeters") || "cm"}</span>
                  </div>
                  <p className="text-xs text-gray-500">{t(`measure.${measurement.field}Desc`) || measurement.description}</p>
                </div>
              ))
            )}

            {/* Saved Data Notice */}
            {hasSavedData && (
              <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">{t("measurement.savedDataLoaded")}</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>{t("measurement.savedDataLoadedDesc")}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                <AlertDescription>{t(`error.${state.error}`) || state.error}</AlertDescription>
              </Alert>
            )}

            {state?.success && (
              <Alert>
                <AlertDescription className="text-green-600">
                  {t(`success.${state.message}`)}
                </AlertDescription>
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
