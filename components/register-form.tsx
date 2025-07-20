"use client"

import { useActionState } from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerUser } from "@/app/actions/auth"
import { Loader2, User, Building } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export function RegisterForm() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [state, action, isPending] = useActionState(registerUser, null);

  // Handle successful registration
  useEffect(() => {
    async function handleSuccessfulRegister() {
      if (state?.success && state?.userData) {
        try {
          // Use the credentials from the server action response
          const result = await signIn("credentials", {
            redirect: false,
            email: state.userData.email,
            password: state.userData.password
          });
          
          if (result?.error) {
            console.error("Auto-login failed after registration:", result.error);
            // Redirect to login page with success message
            router.push(`/${language}?message=registration-success`);
          } else if (result?.ok) {
            // Redirect to dashboard after successful auto-login
            setTimeout(() => {
              router.push(`/${language}/dashboard`);
            }, 1000);
          }
        } catch (loginError) {
          console.error("Failed to auto-login after registration:", loginError);
          router.push(`/${language}?message=registration-success`);
        }
      }
    }
    
    handleSuccessfulRegister();
  }, [state, router, language]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={language} />
      
      <div className="space-y-2">
        <Label htmlFor="name">{t("register.form.name")}</Label>
        <Input 
          id="name" 
          name="name" 
          type="text" 
          placeholder={t("register.form.placeholdername")} 
          required 
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("register.form.email")}</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder={t("register.form.placeholderemail")} 
          required 
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName" className="flex items-center">
          <Building className="h-4 w-4 mr-2" />
          {t("onboarding.companyName")}
        </Label>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          placeholder={t("onboarding.companyNamePlaceholder") || "Enter your company name"}
          required
          disabled={isPending}
          className={state?.error === "onboarding.error.companyNotFound" ? "border-red-500" : ""}
        />
      </div>
      
      {/* Gender Selection */}
      <div className="space-y-3">
        <Label className="flex items-center">
          <User className="h-4 w-4 mr-2" />
          {t("onboarding.gender")}
        </Label>
        <RadioGroup 
          name="gender" 
          defaultValue="male"
          disabled={isPending}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="reg-male" />
            <Label htmlFor="reg-male" className="font-normal">
              {t("onboarding.genderMale")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="reg-female" />
            <Label htmlFor="reg-female" className="font-normal">
              {t("onboarding.genderFemale")}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("register.form.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={t("register.form.placeholderpassword")}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("register.form.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder={t("register.form.placeholderconfirmPassword")}
          required
          disabled={isPending}
        />
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.errorLocale ? t(state.error) : state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert>
          <AlertDescription className="text-green-600">{state.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isPending || state?.success}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("register.form.creating")}
          </>
        ) : state?.success ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("onboarding.redirecting")}
          </>
        ) : (
          t("register.form.submit")
        )}
      </Button>
    </form>
  )
}