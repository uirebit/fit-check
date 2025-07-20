"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, User, Settings, LogOut, Ruler, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { signOut } from "next-auth/react"
import { ExportMeasurementsButton } from "@/components/export-measurements-button" 

interface UserData {
  name: string;
  email: string;
  companyId: string;
  companyName?: string;
  gender: string;
  joinDate: string;
  isLoading?: boolean;
  language?: string;
  picture?: string;
  userType?: number;
  userTypeName?: string;
  isAdmin?: boolean;
  isSuperadmin?: boolean;
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    companyId: "",
    companyName: "",
    gender: "",
    joinDate: "",
    isLoading: true
  });
  const [error, setError] = useState<string | null>(null);

  const { language } = useLanguage();
  
  // Get authentication state from NextAuth
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Load user data on component mount
  useEffect(() => {
    if (authLoading) {
      // Still loading auth state
      return;
    }
    
    if (!isAuthenticated || !user) {
      setError("error.notAuthenticated");
      return;
    }
    
    setError(null); // Clear any previous errors
    
    // User is authenticated via NextAuth, use the session data
    const userType = user.userType || 3; // Default to employee (3) if not set
    const isSuperadmin = user.isSuperadmin === true || userType === 1;
    const isAdmin = user.isAdmin === true || userType === 2;
    
    setUserData({
      name: user.name || "",
      email: user.email || "",
      companyId: user.companyId || "",
      companyName: user.companyName || "",
      gender: user.gender ? 
        t(`onboarding.gender${user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}`) : 
        t("onboarding.genderMale"),
      joinDate: new Date().toISOString().split('T')[0],
      isLoading: false,
      language: language,
      userType: userType,
      userTypeName: userType === 1 ? "Superadmin" : userType === 2 ? "Admin" : "Employee",
      isAdmin: isAdmin,
      isSuperadmin: isSuperadmin
    });
  }, [user, isAuthenticated, authLoading, t, language]);

  const handleSignOut = async () => {
    try {
      // Use NextAuth's signOut function
      await signOut({ redirect: false });
      
      // Redirect to home/login page with current language
      router.push(`/${language}`);
    } catch (error) {
      console.error("Error signing out", error);
      // Even if there's an error, try to redirect
      router.push(`/${language}`);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
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
              <div className="flex items-center space-x-2 flex-shrink-0 mr-2">
                {userData.picture ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img 
                      src={userData.picture} 
                      alt={userData.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none">
                  {userData.isLoading ? "..." : userData.name}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push(`/${language}/settings`)}
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {userData.isLoading ? (
          // Loading skeleton
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {`${t("dashboard.welcomeBack")}, ${userData.name}!`}
              </h1>
              <p className="text-gray-600">{t("dashboard.overview")}</p>
            </div>

            {/* User Info Card */}
            <div className="mb-8">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                    {t("dashboard.profileInformation")}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t("dashboard.accountDetails")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">{t("login.form.email")}</p>
                      <p className="text-xs sm:text-sm text-gray-900 break-all">{userData.email}</p>
                    </div>
                    
                    {/* Mostrar compañía solo si NO es superadmin */}
                    {!userData.isSuperadmin && userData.userType !== 1 && (
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">{t("onboarding.companyName")}</p>
                        <div className="flex items-center">
                          <Badge variant="secondary" className="text-xs sm:text-sm max-w-full truncate">
                            {userData.companyName && userData.companyName !== "N/A" ? userData.companyName : t("dashboard.noCompany")}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Mostrar tipo de usuario para todos */}
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">{t("dashboard.userType")}</p>
                      <div className="flex items-center">
                        {userData.userType === 1 || userData.isSuperadmin ? (
                          <Badge variant="default" className="bg-blue-500 text-xs sm:text-sm">{t("admin.users.superadmin")}</Badge>
                        ) : userData.userType === 2 || userData.isAdmin ? (
                          <Badge variant="secondary" className="text-xs sm:text-sm">{t("admin.users.admin")}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs sm:text-sm">{t("admin.users.employee")}</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Mostrar género solo si se tiene disponible */}
                    {userData.gender && (
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">{t("onboarding.gender")}</p>
                        <p className="text-xs sm:text-sm text-gray-900">{userData.gender}</p>
                      </div>
                    )}
                    
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">{t("dashboard.memberSince")}</p>
                      <p className="text-xs sm:text-sm text-gray-900">{new Date(userData.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className={`grid grid-cols-1 ${(!userData.isSuperadmin && userData.userType !== 1) ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
              {/* Mostrar tarjeta de tallas solo si NO es superadmin */}
              {!userData.isSuperadmin && userData.userType !== 1 && (
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <Ruler className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                      {t("dashboard.clothingSizes")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t("dashboard.manageSizesDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href={`/${userData.language}/sizes`}>
                      <Button className="w-full text-sm">{t("dashboard.manageSizes")}</Button>
                    </Link>
                    
                    {/* Mostrar botón de exportar medidas solo para administradores */}
                    {(userData.isAdmin || userData.userType === 2) && (
                      <div className="mt-2">
                        <ExportMeasurementsButton className="w-full text-sm" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                    {t("dashboard.accountSettings")}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t("dashboard.updateProfile")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Superadmin buttons (only shown to superadmins - userType 1) */}
                    {(userData.isSuperadmin === true || userData.userType === 1) && (
                      <>
                        <Button 
                          className="w-full mb-2 text-sm" 
                          onClick={() => router.push(`/${userData.language || language}/admin/company-management`)}
                        >
                          {t("admin.companies.manage")}
                        </Button>
                        <Button 
                          className="w-full text-sm" 
                          onClick={() => router.push(`/${userData.language || language}/admin/user-management`)}
                        >
                          {t("admin.users.manage")}
                        </Button>
                      </>
                    )}
                    
                    {/* Company admins can manage clothing items for their company */}
                    {(userData.isAdmin === true || userData.userType === 1 || userData.userType === 2) && !userData.isSuperadmin && (
                      <Button 
                        className="w-full text-sm"
                        variant="secondary"
                        onClick={() => router.push(`/${userData.language || language}/admin/company-cloth-management`)}
                      >
                        {t("admin.manageCompanyClothes")}
                      </Button>
                    )}
                    
                    {/* Account settings button */}
                    <Button 
                      className="w-full text-sm" 
                      variant="outline" 
                      onClick={() => router.push(`/${userData.language || language}/settings`)}
                    >
                      {t("dashboard.accountSettings")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
