"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSavedSizes, deleteSavedSize } from "@/app/actions/sizes"
import { Trash2, Edit, Package, Calendar } from "lucide-react"

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

  useEffect(() => {
    loadSavedSizes()
  }, [])

  const loadSavedSizes = async () => {
    try {
      const sizes = await getSavedSizes()
      setSavedSizes(sizes)
    } catch (error) {
      console.error("Failed to load saved sizes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this size information?")) {
      try {
        await deleteSavedSize(id)
        setSavedSizes(savedSizes.filter((size) => size.id !== id))
      } catch (error) {
        console.error("Failed to delete size:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved sizes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Saved Sizes</h1>
        <p className="text-gray-600">
          Manage your work clothing size information. You have {savedSizes.length} saved size
          {savedSizes.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {savedSizes.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            You haven't saved any clothing sizes yet. Start by selecting a clothing type and entering your measurements.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedSizes.map((size) => (
            <Card key={size.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{size.clothingName}</CardTitle>
                  <Badge variant="default" className="text-lg">
                    {size.calculatedSize}
                  </Badge>
                </div>
                <CardDescription className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  Saved {new Date(size.savedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Measurements:</h4>
                  <div className="space-y-1">
                    {Object.entries(size.measurements).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                        <span className="font-medium">{value} cm</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
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
