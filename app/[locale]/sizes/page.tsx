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
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/language-context"

// Using translation keys directly in error states

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
          setError("error.notAuthenticated");
          setLoading(false);
          return;
        }
        
        // Pass the email to the server action
        const items = await getCompanyClothingItems(userEmail);
        
        if (items.length > 0) {
          setClothingTypes(items);
          setError(null);
        } else {
          setError("error.noClothingFound");
        }
      } catch (err) {
        console.error("Failed to load clothing items:", err)
        setError("error.loadingFailed")
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
  
  // Sort clothing items by category and then by name
  const getSortedClothingItems = (): ClothingItem[] => {
    if (!clothingTypes.length) return [];
    
    return clothingTypes.slice().sort((a, b) => {
      // Get translated category names for sorting
      const categoryA = a.categoryTranslationKey ? t(a.categoryTranslationKey) : 
                       (a.category_description || String(a.category_id || "ZZZ"));
      const categoryB = b.categoryTranslationKey ? t(b.categoryTranslationKey) : 
                       (b.category_description || String(b.category_id || "ZZZ"));
      
      // First sort by category
      const categoryCompare = categoryA.localeCompare(categoryB, undefined, { sensitivity: 'base' });
      if (categoryCompare !== 0) {
        return categoryCompare;
      }
      
      // If same category, sort by clothing name
      const nameA = t(a.translationKey || "");
      const nameB = t(b.translationKey || "");
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  };
  
  // Group clothing items by category
  const getGroupedClothingItems = (): { category: string, items: ClothingItem[] }[] => {
    const sorted = getSortedClothingItems();
    const grouped: { [key: string]: { category: string, items: ClothingItem[] } } = {};
    
    sorted.forEach(item => {
      const categoryKey = item.categoryTranslationKey || 
                         (item.category_description ? `category.${item.category_description.toLowerCase().replace(/\s+/g, "_")}` : 
                         (item.category_id ? `category.${item.category_id}` : "category.other"));
      
      const categoryLabel = item.categoryTranslationKey ? t(item.categoryTranslationKey) : 
                           (item.category_description || (item.category_id ? `Category ${item.category_id}` : t("category.other")));
      
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = {
          category: categoryLabel,
          items: []
        };
      }
      
      grouped[categoryKey].items.push(item);
    });
    
    // Convert the object to array and sort by category name
    return Object.values(grouped).sort((a, b) => 
      a.category.localeCompare(b.category, undefined, { sensitivity: 'base' })
    );
  };

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
              <span className="text-2xl font-bold text-gray-900">{t("header.title")}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setShowSaved(!showSaved)}>
                <Save className="h-4 w-4 mr-2" />
                {showSaved ? t("header.addSizes") : t("header.savedSizes")}
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{userData.name}</span>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {t("header.settings")}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("header.signOut")}
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("main.title")}</h1>
              <p className="text-gray-600">
                {t("main.subtitle")}
              </p>
            </div>

            {/* Clothing Type Selection */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="h-5 w-5 mr-2 text-blue-600" />
                  {t("main.selectClothing")}
                </CardTitle>
                <CardDescription>{t("main.selectClothingDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">{t("loading.clothingTypes")}</span>
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("error.title")}</AlertTitle>
                    <AlertDescription>{t(error || "")}</AlertDescription>
                  </Alert>
                ) : clothingTypes.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("error.noItemsFound")}</AlertTitle>
                    <AlertDescription>{t("error.noCompanyItems")}</AlertDescription>
                  </Alert>
                ) : (
                  <Select value={selectedClothing} onValueChange={handleClothingChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('main.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {getGroupedClothingItems().map((group, groupIndex) => (
                        <div key={`group-${groupIndex}`}>
                          {/* Category Heading */}
                          <div className="px-2 py-1.5 text-sm font-semibold bg-slate-100 text-slate-800 sticky top-0 z-10">
                            {group.category}
                          </div>
                          
                          {/* Category Items */}
                          {group.items
                            .sort((a, b) => {
                              const nameA = t(a.translationKey || "");
                              const nameB = t(b.translationKey || "");
                              return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
                            })
                            .map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                <div className="flex items-center w-full">
                                  <span>{t(type.translationKey || "")}</span>
                                </div>
                              </SelectItem>
                            ))
                          }
                          
                          {/* Separator between categories */}
                          {groupIndex < getGroupedClothingItems().length - 1 && (
                            <Separator className="my-1" />
                          )}
                        </div>
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
