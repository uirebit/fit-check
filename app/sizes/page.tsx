"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ClothingMeasurement } from "@/components/clothing-measurement"
import { SavedSizes } from "@/components/saved-sizes"
import { Zap, User, Settings, LogOut, Ruler, Save } from "lucide-react"

const clothingTypes = [
  { id: "work-hat", name: "Work Hat", category: "headwear" },
  { id: "safety-helmet", name: "Safety Helmet", category: "headwear" },
  { id: "work-shirt", name: "Work Shirt", category: "tops" },
  { id: "polo-shirt", name: "Polo Shirt", category: "tops" },
  { id: "work-jacket", name: "Work Jacket", category: "outerwear" },
  { id: "safety-vest", name: "Safety Vest", category: "outerwear" },
  { id: "work-pants", name: "Work Pants", category: "bottoms" },
  { id: "work-shorts", name: "Work Shorts", category: "bottoms" },
  { id: "coveralls", name: "Coveralls", category: "full-body" },
  { id: "work-boots", name: "Work Boots", category: "footwear" },
  { id: "safety-shoes", name: "Safety Shoes", category: "footwear" },
  { id: "work-gloves", name: "Work Gloves", category: "accessories" },
  { id: "work-socks", name: "Work Socks", category: "accessories" },
  { id: "belt", name: "Work Belt", category: "accessories" },
  { id: "rain-coat", name: "Rain Coat", category: "outerwear" },
]

export default function SizesPage() {
  const [selectedClothing, setSelectedClothing] = useState<string>("")
  const [showSaved, setShowSaved] = useState(false)

  // Mock user data - in real app, get from session/database
  const userData = {
    name: "John Doe",
    email: "user@gmail.com",
    gender: "male" as "male" | "female",
  }

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
                <Select value={selectedClothing} onValueChange={handleClothingChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a clothing type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clothingTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{type.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {type.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Measurement Component */}
            {selectedClothing && (
              <ClothingMeasurement
                key={selectedClothing} // This forces component remount when clothing type changes
                clothingType={selectedClothing}
                clothingName={clothingTypes.find((t) => t.id === selectedClothing)?.name || ""}
                userGender={userData.gender}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
