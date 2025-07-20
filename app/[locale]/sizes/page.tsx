"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { ClothingMeasurement } from "@/components/clothing-measurement"
import { SavedSizes } from "@/components/saved-sizes"
import { Zap, User, Settings, LogOut, Ruler, Save, AlertCircle } from "lucide-react"
import { getCompanyClothingItems, ClothingItem } from "@/app/actions/clothing"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { signOut } from "next-auth/react"

// Using translation keys directly in error states

export default function SizesPage() {
  const [selectedClothing, setSelectedClothing] = useState<string>("")
  const [showSaved, setShowSaved] = useState(false)
  const [clothingTypes, setClothingTypes] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)  
  const { t, language } = useLanguage() // Get translations
  
  
  // Get user data from NextAuth session
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  
  // Map user data from session
  const userData = {
    name: user?.name || "",
    email: user?.email || "",
    gender: (user?.gender === "Male" ? "male" : "female") as "male" | "female",
  }
  
  // Load clothing items from the database
  useEffect(() => {
    async function loadClothingItems() {
      try {
        setLoading(true)
        
        // Get items from server action (now using NextAuth for auth)
        const items = await getCompanyClothingItems();
        
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
    
    // Only load items if authentication is complete
    if (!authLoading) {
      loadClothingItems()
    }
  }, [authLoading, isAuthenticated])

  // Handle clothing type change with debounce to prevent multiple rapid changes
  const handleClothingChange = (value: string) => {
    // Only update if the value is different to prevent unnecessary re-renders
    if (value !== selectedClothing) {
      console.log(`Changing clothing type to: ${value}`);
      setSelectedClothing(value);
    }
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

  const handleSignOut = async () => {
    try {
      // Use NextAuth to sign out
      await signOut({ redirectTo: '/' });
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback to simple redirect
      window.location.href = "/";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{t("header.title")}</span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
               <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.href = `/${language}/dashboard`}
                  className="flex-shrink-0"
                >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("header.returndashboard")}</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSaved(!showSaved)}
                className="flex-shrink-0"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{showSaved ? t("header.addSizes") : t("header.savedSizes")}</span>
                <span className="sm:hidden">{showSaved ? "Add" : "Saved"}</span>
              </Button>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium truncate max-w-[60px] sm:max-w-none">{userData.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = `/${language}/settings`}
                className="flex-shrink-0"
              >
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("header.settings")}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="flex-shrink-0"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("header.signOut")}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {authLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">{t("loading.authenticating")}</span>
          </div>
        ) : !isAuthenticated ? (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("error.title")}</AlertTitle>
            <AlertDescription>
              {t("error.notAuthenticated")}
              <Button 
                variant="link" 
                className="px-0 py-0 ml-1 h-auto"
                onClick={() => window.location.href = `/${t("locale") || "en"}/login`}
              >
                {t("login.goToLogin")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : showSaved ? (
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
                    <SelectContent className="max-h-80 w-[calc(100vw-32px)] sm:w-auto">
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
                                  <span className="truncate">{t(type.translationKey || "")}</span>
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
