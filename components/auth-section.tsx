"use client"

import { useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import axios from "axios"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { OnboardingForm } from "./onboarding-form"
import { ForgotPasswordForm } from "./forgot-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Chrome } from "lucide-react"
import { handleGoogleAuth } from "@/app/actions/auth"
import { useLanguage } from "@/contexts/language-context"

type AuthStep = "auth" | "onboarding" | "forgot-password"

export function AuthSection() {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true)
  const [authStep, setAuthStep] = useState<AuthStep>("auth")
  const [userEmail, setUserEmail] = useState<string>("")
  const [loading, setLoading] = useState(false)
  
  const handleForgotPassword = () => {
    setAuthStep("forgot-password")
  }
  
  const handleBackToLogin = () => {
    setAuthStep("auth")
    setIsLogin(true)
  }

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
        } else if (result.requiresOnboarding) {
          // Store the partial user data and session token for onboarding
          if (result.userData) {
            localStorage.setItem("user_data", JSON.stringify(result.userData));
          }
          
          if (result.sessionToken) {
            localStorage.setItem("auth_token", result.sessionToken);
            localStorage.setItem("user_session", "active");
            
            // Set cookies for server-side auth
            try {
              await fetch('/api/auth/cookie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: result.sessionToken, session: 'active' })
              });
            } catch (cookieError) {
              console.error("Failed to set auth cookies", cookieError);
            }
          }
          
          setUserEmail(googleProfile.email)
          setAuthStep("onboarding")
        } else if (result.redirect) {
          // Store the user data and session token before redirecting
          if (result.userData) {
            // Ensure admin status is correctly set in localStorage
            const userData = {
              ...result.userData,
              // Make sure isAdmin is explicitly set as a boolean
              isAdmin: result.userData.isAdmin === true || result.userData.userType === 1
            };
            localStorage.setItem("user_data", JSON.stringify(userData));
          }
          
          if (result.sessionToken) {
            localStorage.setItem("auth_token", result.sessionToken);
            localStorage.setItem("user_session", "active");
            
            // Set cookies for server-side auth
            try {
              await fetch('/api/auth/cookie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: result.sessionToken, session: 'active' })
              });
            } catch (cookieError) {
              console.error("Failed to set auth cookies", cookieError);
            }
          }
          
          // Redirect to dashboard with the current language
          const pathParts = window.location.pathname.split('/');
          const language = pathParts.length > 1 ? pathParts[1] : 'en';
          window.location.href = `/${language}/dashboard`;
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
    // Get current language from pathname
    const pathParts = window.location.pathname.split('/');
    const language = pathParts.length > 1 ? pathParts[1] : 'en';
    window.location.href = `/${language}/dashboard`
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
  
  if (authStep === "forgot-password") {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("forgotPassword.title")}</CardTitle>
          <CardDescription className="text-center">
            {t("forgotPassword.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm onBack={handleBackToLogin} />
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

        {isLogin ? <LoginForm onForgotPassword={handleForgotPassword} /> : <RegisterForm />}

        <div className="text-center">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-sm">
            {isLogin ? t("signin.dontHaveAccount") : t("signin.alreadyHaveAccount")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}