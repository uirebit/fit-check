"use client"

import { useState } from "react"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { OnboardingForm } from "./onboarding-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Chrome } from "lucide-react"

type AuthStep = "auth" | "onboarding"

export function AuthSection() {
  const [isLogin, setIsLogin] = useState(true)
  const [authStep, setAuthStep] = useState<AuthStep>("auth")
  const [userEmail, setUserEmail] = useState<string>("")

  const handleGoogleSignUp = async () => {
    // Simulate Google OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (isLogin) {
      // For existing users, redirect directly to dashboard
      const mockGoogleUser = {
        email: "user@gmail.com",
        name: "John Doe",
        picture: "https://via.placeholder.com/40",
      }

      // In a real app, you would verify the user exists and redirect to dashboard
      window.location.href = "/dashboard"
    } else {
      // For new users, go to onboarding
      const mockGoogleUser = {
        email: "user@gmail.com",
        name: "John Doe",
        picture: "https://via.placeholder.com/40",
      }

      setUserEmail(mockGoogleUser.email)
      setAuthStep("onboarding")
    }
  }

  const handleOnboardingComplete = () => {
    // Reset to auth step or redirect to dashboard
    setAuthStep("auth")
    // In a real app, you would redirect to dashboard here
    window.location.href = "/dashboard"
  }

  if (authStep === "onboarding") {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Please provide some additional information to complete your registration
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
        <CardTitle className="text-2xl font-bold text-center">{isLogin ? "Welcome back" : "Create account"}</CardTitle>
        <CardDescription className="text-center">
          {isLogin ? "Enter your credentials to access your account" : "Enter your information to create a new account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Sign In Button - Available for both login and registration */}
        <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
          <Chrome className="mr-2 h-4 w-4" />
          {isLogin ? "Continue with Google" : "Sign up with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {isLogin ? "Or sign in with email" : "Or continue with email"}
            </span>
          </div>
        </div>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="text-center">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-sm">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
