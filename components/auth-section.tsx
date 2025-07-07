"use client"

import { useState } from "react"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { OnboardingForm } from "./onboarding-form"
import { ForgotPasswordForm } from "./forgot-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Chrome } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { signIn } from "next-auth/react"

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

  // Google login handler that uses NextAuth directly
  const handleGoogleSignIn = () => {
    try {
      setLoading(true);
      
      // Get current language for redirection
      const pathParts = window.location.pathname.split('/');
      const language = pathParts.length > 1 ? pathParts[1] : 'en';
      
      // For Google OAuth, we need to redirect to their auth page
      // We use the callbackUrl to tell NextAuth where to go after successful auth
      signIn("google", { 
        callbackUrl: `/${language}/dashboard`
      });
      
      // Note: No need for error handling here since Google login
      // will redirect away from this page entirely
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    // Get current language from pathname
    const pathParts = window.location.pathname.split('/');
    const language = pathParts.length > 1 ? pathParts[1] : 'en';
    const redirectUrl = `/${language}/dashboard`;
    
    try {
      // Use credentials provider without direct redirect to avoid header errors
      const signInResult = await signIn("credentials", {
        email: userEmail,
        password: `google-oauth2-${Date.now()}`, // Special format to indicate Google auth
        redirect: false
      });
      
      if (signInResult?.error) {
        console.error("Authentication error:", signInResult.error);
        alert(signInResult.error || "Authentication failed");
      } else {
        // Manual navigation after successful sign-in
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error("Failed to sign in after onboarding:", error);
      // Fallback to manual navigation
      window.location.href = redirectUrl;
    }
    
    setAuthStep("auth");
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
          <OnboardingForm onComplete={handleOnboardingComplete} />
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
          onClick={handleGoogleSignIn}
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