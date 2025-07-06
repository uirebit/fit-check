"use client"

import { useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import axios from "axios"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { OnboardingForm } from "./onboarding-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Chrome } from "lucide-react"
import { handleGoogleAuth } from "@/app/actions/auth"
import { useLanguage } from "@/contexts/language-context"

type AuthStep = "auth" | "onboarding"

export function AuthSection() {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true)
  const [authStep, setAuthStep] = useState<AuthStep>("auth")
  const [userEmail, setUserEmail] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        // Fetch user profile from Google
        const { data: googleProfile } = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        )

        // Call your server action
        const result = await handleGoogleAuth({
          id: googleProfile.sub,
          email: googleProfile.email,
          name: googleProfile.name,
          picture: googleProfile.picture,
          verified_email: googleProfile.email_verified,
        })

        if (result.success === false && result.error) {
          alert(result.error)
        } else if (result.redirect) {
          window.location.href = result.redirect
        } else if (result.requiresOnboarding) {
          setUserEmail(googleProfile.email)
          setAuthStep("onboarding")
        }
      } catch (err) {
        alert("Google sign-in failed.")
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      alert("Google sign-in failed.")
      setLoading(false)
    },
  })

  const handleOnboardingComplete = () => {
    setAuthStep("auth")
    window.location.href = "/dashboard"
  }

  if (authStep === "onboarding") {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("onboarding.completeprofile")}</CardTitle>
          <CardDescription className="text-center">
            {t("onboarding.completeprofile.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm userEmail={userEmail} onComplete={handleOnboardingComplete} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{isLogin ? t("signin.back") : t("signin.create")}</CardTitle>
        <CardDescription className="text-center">
          {isLogin ? t("signin.enterCredentials") : t("signin.enterInformation")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => googleLogin()}
          disabled={loading}
        >
          <Chrome className="mr-2 h-4 w-4" />
          {loading
            ? t("signin.signingInWithGoogle")
            : isLogin
            ? t("signin.signInWithGoogle")
            : t("signin.signUpWithGoogle")}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {isLogin ? t("signin.orSignInWithEmail") : t("signin.orContinueWithEmail")}
            </span>
          </div>
        </div>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="text-center">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-sm">
            {isLogin ? t("signin.dontHaveAccount") : t("signin.alreadyHaveAccount")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}