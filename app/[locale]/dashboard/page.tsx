"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, User, Settings, LogOut, Ruler } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  // In a real app, you would fetch this data from your database/session
  const userData = {
    name: "John Doe",
    email: "user@gmail.com",
    companyId: "ACME123",
    gender: "Male",
    joinDate: "2024-01-15",
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
              <span className="text-2xl font-bold text-gray-900">WebApp</span>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {userData.name}!</h1>
          <p className="text-gray-600">Here's your personalized dashboard overview.</p>
        </div>

        {/* User Info Card */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details and company information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{userData.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Company ID</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{userData.companyId}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p className="text-gray-900">{userData.gender}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-gray-900">{new Date(userData.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ruler className="h-5 w-5 mr-2 text-blue-600" />
                Clothing Sizes
              </CardTitle>
              <CardDescription>Manage your work clothing measurements and sizes</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/sizes">
                <Button className="w-full">Manage Sizes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-600" />
                Account Settings
              </CardTitle>
              <CardDescription>Update your profile and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
