"use client"

import { AuthSection } from "@/components/auth-section"
import { Zap } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function HomePage() {
  const { t } = useLanguage()

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
                {t("main.title")}
                <span className="text-blue-600 block">{t("main.subtitle")}</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {t("main.description")}
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

          {/* Right side - Auth forms */}
          <div className="flex justify-center lg:justify-end">
            <AuthSection />
          </div>
        </div>
      </div>
    </div>
  )
}
