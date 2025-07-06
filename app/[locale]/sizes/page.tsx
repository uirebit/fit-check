"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ClothingMeasurement } from "@/components/clothing-measurement"
import { SavedSizes } from "@/components/saved-sizes"
import { Zap, User, Settings, LogOut, Ruler, Save, AlertCircle } from "lucide-react"
import { getCompanyClothingItems, ClothingItem } from "@/app/actions/clothing"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"

export default function SizesPage() {
  const [selectedClothing, setSelectedClothing] = useState<string>("")
  const [showSaved, setShowSaved] = useState(false)
  const [clothingTypes, setClothingTypes] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)  
  const { t } = useLanguage() // Get translations
  
  
  // User data from localStorage
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    gender: "male" as "male" | "female",
  })
  
  // Get user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Get user data from localStorage
        const storedUser = localStorage.getItem("user_data");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserData({
            name: parsedUser.name || "",
            email: parsedUser.email || "",
            gender: parsedUser.is_male ? "male" : "female",
          });
        }
      } catch (err) {
        console.error("Error getting user data from localStorage:", err);
      }
    }
  }, []);
  
  // Load clothing items from the database
  useEffect(() => {
    async function loadClothingItems() {
      try {
        setLoading(true)
        
        // Get user email from localStorage
        let userEmail = userData.email;
        
        // If userData doesn't have email yet, try to get it directly from localStorage
        if (!userEmail && typeof window !== "undefined") {
          const storedUser = localStorage.getItem("user_data");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            userEmail = parsedUser.email;
          }
        }
        
        if (!userEmail) {
          setError("User not authenticated. Please log in again.");
          setLoading(false);
          return;
        }
        
        // Pass the email to the server action
        const items = await getCompanyClothingItems(userEmail);
        
        if (items.length > 0) {
          setClothingTypes(items);
          setError(null);
        } else {
          setError("No clothing items found for your company");
        }
      } catch (err) {
        console.error("Failed to load clothing items:", err)
        setError("Failed to load clothing items. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    loadClothingItems()
  }, [userData.email])

  // Clear form when clothing type changes
  const handleClothingChange = (value: string) => {
    setSelectedClothing(value)
  }

  const handleSignOut = () => {
    // In a real app, you would:
    // 1. Clear session/JWT tokens
    // 2. Clear localStorage/sessionStorage
    // 3. Redirect to login page
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">WorkWear Sizes</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setShowSaved(!showSaved)}>
                <Save className="h-4 w-4 mr-2" />
                {showSaved ? "Add Sizes" : "Saved Sizes"}
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{userData.name}</span>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {showSaved ? (
          <SavedSizes />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Your Work Clothing Sizes</h1>
              <p className="text-gray-600">
                Select a clothing type and follow the measurement instructions to get your perfect fit.
              </p>
            </div>

            {/* Clothing Type Selection */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="h-5 w-5 mr-2 text-blue-600" />
                  Select Clothing Type
                </CardTitle>
                <CardDescription>Choose the type of work clothing you want to measure</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading clothing types...</span>
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : clothingTypes.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No items found</AlertTitle>
                    <AlertDescription>No clothing items are available for your company. Please contact your administrator.</AlertDescription>
                  </Alert>
                ) : (
                  <Select value={selectedClothing} onValueChange={handleClothingChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('main.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {clothingTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{t(type.translationKey || "")}</span>
                            <Badge variant="secondary" className="ml-2">
                              {type.categoryTranslationKey ? t(type.categoryTranslationKey) : 
                               (type.category_description || (type.category_id ? `Category ${type.category_id}` : t("category.other") || "Other"))}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Measurement Component */}
            {selectedClothing && (
              <ClothingMeasurement
                key={selectedClothing} // This forces component remount when clothing type changes
                clothingType={selectedClothing}
                clothingName={clothingTypes.find((t) => t.id === selectedClothing)?.translationKey || ""}
                userGender={userData.gender}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
