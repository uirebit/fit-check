


"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { completeOnboarding } from "@/app/actions/auth"
import { Loader2, Building, User } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useEffect } from "react"
import { signIn } from "@/auth"

interface OnboardingFormProps {
  onComplete: () => void
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [state, action, isPending] = useActionState(completeOnboarding, null)

  const { t, language } = useLanguage();
  // Handle successful completion
  useEffect(() => {
    async function completeOnboardingProcess() {
      if (state?.success) {
        // Notify parent component that onboarding is complete
        // Auth-section will handle the NextAuth sign-in process
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    }
    
    completeOnboardingProcess();
  }, [state, onComplete]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={language} />

      {/* Welcome message */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-sm text-muted-foreground">{t("onboarding.welcome")}</p>
      </div>

      {/* Company Name */}
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
        <p className="text-xs text-muted-foreground">
          {t("onboarding.companyNameHelp") || t("onboarding.companyIdHelp")}
        </p>
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <Label className="flex items-center">
          <User className="h-4 w-4 mr-2" />
          {t("onboarding.gender")}
        </Label>
        <RadioGroup name="gender" required disabled={isPending}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="font-normal">
              {t("onboarding.genderMale")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="font-normal">
              {t("onboarding.genderFemale")}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.errorLocale ? t(state.error) : state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert>
          <AlertDescription className="text-green-600">
            {t("onboarding.successMessage")}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isPending || state?.success}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("onboarding.completingSetup")}
          </>
        ) : state?.success ? (
          t("onboarding.redirecting")
        ) : (
          t("onboarding.completeSetup")
        )}
      </Button>
    </form>
  )
}
