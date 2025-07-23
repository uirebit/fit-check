"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { Zap, ArrowLeft, Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

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

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    companyId: "",
    companyName: "",
    gender: "",
    joinDate: "",
    isLoading: true,
    language: language
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Load user data on component mount
  useEffect(() => {
    async function loadUserData() {
      try {
        setError(null);
        
        // Check if user is authenticated with NextAuth
        if (!isAuthenticated) {
          if (authLoading) {
            // Still loading auth state, wait
            return;
          }
          
          // Not authenticated, redirect to login
          setError(t("settings.error.notAuthenticated"));
          setTimeout(() => {
            router.push(`/${language}`);
          }, 2000);
          return;
        }
        
        // User is authenticated, set data from NextAuth session
        if (user) {
          setUserData({
            name: user.name || "",
            email: user.email || "",
            companyId: user.companyId || "",
            companyName: user.companyName || "",
            gender: user.gender || "Male",
            joinDate: "",  // This might not be in the NextAuth session
            isLoading: false,
            language: language || 'en',
            userType: user.userType,
            userTypeName: user.userType === 1 ? "Superadmin" : user.userType === 2 ? "Admin" : "Employee",
            isAdmin: user.isAdmin || false,
            isSuperadmin: user.isSuperadmin || false
          });
        }
      } catch (error) {
        console.error("Failed to load user settings", error);
        setError(t("settings.error.loadFailed"));
      }
    }
    
    loadUserData();
  }, [router, language, t, user, isAuthenticated, authLoading]);
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Create form data to send to server action
      const formData = new FormData();
      formData.append("name", userData.name || "");
      formData.append("gender", userData.gender || "Male");
      
      // Import and call the server action
      const { updateUserProfile } = await import("@/app/actions/auth");
      const result = await updateUserProfile(null, formData);
      
      if (result.success) {
        setSuccessMessage(t(result.message as string));
        
        // In NextAuth v5 we don't need to manually update the session
        // The session will be refreshed on reload since we're using the JWT strategy
        // with the "update" trigger in the callbacks
        
        // Force refresh of the page to get the updated session
        window.location.reload();
      } else {
        // Handle error from server action
        const errorMessage = result.errorLocale 
          ? t(result.error as string)
          : result.error;
        setError(errorMessage || t("settings.error.saveFailed"));
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setError(t("settings.error.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLanguageChange = (newLanguage: string) => {
    // Update user data with new language
    setUserData({...userData, language: newLanguage});
    
    // Set language cookie for the app
    document.cookie = `NEXT_LOCALE=${newLanguage}; path=/; max-age=${60*60*24*365}`;
    
    // Navigate to the same page but with new language path
    router.push(`/${newLanguage}/settings`);
  };
  
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{t("header.title")}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/${language}/dashboard`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("settings.backToDashboard")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {t("settings.title")}
        </h1>
        
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">{t("settings.tabs.profile")}</TabsTrigger>
            <TabsTrigger value="preferences">{t("settings.tabs.preferences")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.profile.title")}</CardTitle>
                <CardDescription>{t("settings.profile.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("register.form.name")}</Label>
                        <Input 
                          id="name" 
                          value={userData.name || ""} 
                          onChange={(e) => setUserData({...userData, name: e.target.value})}
                          placeholder={t("register.form.placeholdername")}
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("login.form.email")}</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={userData.email || ""} 
                          disabled={true} // Email cannot be changed
                          placeholder={t("login.form.placeholderemail")}
                        />
                        <p className="text-xs text-gray-500">{t("settings.profile.emailCannotChange")}</p>
                      </div>
                      
                      {/* Mostrar tipo de usuario para superadmin */}
                      {(userData.isSuperadmin || userData.userType === 1) && (
                        <div className="space-y-2">
                          <Label>{t("dashboard.userType")}</Label>
                          <Input 
                            value="Superadmin" 
                            disabled={true}
                          />
                        </div>
                      )}
                      
                      {/* Mostrar género solo si NO es superadmin */}
                      {!userData.isSuperadmin && userData.userType !== 1 && (
                        <div className="space-y-2">
                          <Label>{t("onboarding.gender")}</Label>
                          <RadioGroup 
                            value={userData.gender === "Male" ? "male" : "female"} 
                            onValueChange={(value) => setUserData({...userData, gender: value === "male" ? "Male" : "Female"})}
                            disabled={isSubmitting}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="male" id="male" />
                                <Label htmlFor="male">{t("onboarding.genderMale")}</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="female" id="female" />
                                <Label htmlFor="female">{t("onboarding.genderFemale")}</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                      
                      {/* Mostrar compañía solo si NO es superadmin */}
                      {!userData.isSuperadmin && userData.userType !== 1 && (
                        <div className="space-y-2">
                          <Label>{t("onboarding.companyName")}</Label>
                          <Input 
                            value={userData.companyName && userData.companyName !== "N/A" ? userData.companyName : t("dashboard.noCompany")}
                            disabled={true} // Company cannot be changed by user
                          />
                          <p className="text-xs text-gray-500">{t("settings.profile.companyCannotChange")}</p>
                        </div>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>{t("settings.profile.saving")}</>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t("settings.profile.save")}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.preferences.title")}</CardTitle>
                <CardDescription>{t("settings.preferences.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>{t("language.select")}</Label>
                    <RadioGroup 
                      value={userData.language || language} 
                      onValueChange={handleLanguageChange}
                    >
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="en" id="en" />
                          <Label htmlFor="en">{t("language.english")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="es" id="es" />
                          <Label htmlFor="es">{t("language.spanish")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pt" id="pt" />
                          <Label htmlFor="pt">{t("language.portuguese")}</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
