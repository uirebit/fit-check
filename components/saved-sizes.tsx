"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSavedSizes, deleteSavedSize } from "@/app/actions/sizes"
import { Trash2, Edit, Package, Calendar } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"

interface SavedSize {
  id: string
  clothingType: string
  clothingName: string
  measurements: Record<string, string>
  calculatedSize: string
  savedAt: string
}

export function SavedSizes() {
  const [savedSizes, setSavedSizes] = useState<SavedSize[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      // Solo cargar tallas cuando la sesión esté lista y el usuario esté autenticado
      if (isAuthenticated) {
        loadSavedSizes()
      } else {
        setLoading(false)
      }
    }
  }, [isLoading, isAuthenticated, user])

  const loadSavedSizes = async () => {
    try {
      // Solo cargar tallas si el usuario está autenticado con NextAuth
      if (!isAuthenticated || !user?.email) {
        console.error("No authenticated user found");
        setSavedSizes([]);
        setLoading(false);
        return;
      }
      
      // Obtener las tallas guardadas usando la sesión de NextAuth en el servidor
      // Ya no necesitamos pasar el userEmail porque se obtiene en el servidor
      const sizes = await getSavedSizes()
      setSavedSizes(sizes)
    } catch (error) {
      console.error("Failed to load saved sizes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("saved.confirmDelete") || "Are you sure you want to delete this size information?")) {
      try {
        await deleteSavedSize(id)
        setSavedSizes(savedSizes.filter((size) => size.id !== id))
      } catch (error) {
        console.error("Failed to delete size:", error)
      }
    }
  }
  
  const handleEdit = (size: SavedSize) => {
    // Redirigir a la página principal de tallas con el ID de la talla para editar
    const clothTypeParam = size.clothingType ? `clothType=${encodeURIComponent(size.clothingType)}` : '';
    const clothNameParam = size.clothingName ? `&clothName=${encodeURIComponent(size.clothingName)}` : '';
    const sizeIdParam = `&sizeId=${encodeURIComponent(size.id)}`;
    
    // Obtener el idioma actual de la URL o usar el predeterminado
    const locale = window.location.pathname.split('/')[1] || 'en';
    
    // Redirigir a la página principal con los parámetros
    window.location.href = `/${locale}/sizes?${clothTypeParam}${clothNameParam}${sizeIdParam}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("saved.loading")}</p>
        </div>
      </div>
    )
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
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("saved.title")}</h1>
        <p className="text-gray-600">
          {savedSizes.length === 1 
            ? t("saved.subtitle").replace("{count}", savedSizes.length.toString())
            : t("saved.subtitlePlural").replace("{count}", savedSizes.length.toString())}
        </p>
      </div>

      {savedSizes.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            {t("saved.noSizes")}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSizes.map((size) => (
            <Card key={size.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t(`fc_cloth.${size.clothingName.toLowerCase().replace(/\s+/g, "_")}`) || size.clothingName}</CardTitle>
                  <Badge variant="default" className="text-lg">
                    {size.calculatedSize}
                  </Badge>
                </div>
                <CardDescription className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {t("saved.saved")} {new Date(size.savedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">{t("saved.measurements")}</h4>
                  <div className="space-y-1">
                    {Object.entries(size.measurements).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{t(`measure.${key}`) || key.replace(/([A-Z])/g, " $1").trim()}:</span>
                        <span className="font-medium">{value} cm</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(size)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t("saved.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(size.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
