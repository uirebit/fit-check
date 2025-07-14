"use client"

import { OnboardingForm } from "@/components/onboarding-form"
import { Zap } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"

export default function OnboardingPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Redirect if user is already complete or is superadmin
  useEffect(() => {
    if (!isLoading && user) {
      // If user is superadmin, redirect to dashboard
      if (user.isSuperadmin) {
        router.push("/dashboard")
        return
      }
      
      // If user already has companyId and gender, redirect to dashboard
      if (user.companyId && user.gender) {
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  const handleOnboardingComplete = async () => {
    try {
      // Get current language from pathname
      const pathParts = window.location.pathname.split('/');
      const language = pathParts.length > 1 ? pathParts[1] : 'en';
      
      // Redirect with query parameter to indicate onboarding completion
      window.location.href = `/${language}/dashboard?onboarding-completed=true`;
      
    } catch (error) {
      console.error("Failed to redirect after onboarding:", error);
      const pathParts = window.location.pathname.split('/');
      const language = pathParts.length > 1 ? pathParts[1] : 'en';
      window.location.href = `/${language}/dashboard?onboarding-completed=true`;
    }
  }

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{t("header.title")}</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Marketing content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {t("onboarding.title") || "Complete Your"}
                <span className="text-blue-600 block">{t("onboarding.subtitle") || "Setup"}</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t("onboarding.description") || "We need a few more details to personalize your experience."}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t("main.features.fast.title")}</h3>
                  <p className="text-gray-600">{t("main.features.fast.description")}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t("main.features.secure.title")}</h3>
                  <p className="text-gray-600">{t("main.features.secure.description")}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t("main.features.developer_friendly.title")}</h3>
                  <p className="text-gray-600">{t("main.features.developer_friendly.description")}</p>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{t("main.trusted_by")}</span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                  ))}
                </div>
                <span>{t("main.rating")}</span>
              </div>
            </div>
          </div>

          {/* Right side - Onboarding form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md space-y-8">
              <div className="bg-white rounded-lg border shadow-sm p-8">
                <OnboardingForm onComplete={handleOnboardingComplete} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}