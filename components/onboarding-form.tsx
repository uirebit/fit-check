"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { completeOnboarding } from "@/app/actions/auth"
import { Loader2, Building, User } from "lucide-react"

interface OnboardingFormProps {
  userEmail: string
  onComplete: () => void
}

export function OnboardingForm({ userEmail, onComplete }: OnboardingFormProps) {
  const [state, action, isPending] = useActionState(completeOnboarding, null)

  // Handle successful completion
  if (state?.success) {
    setTimeout(() => {
      onComplete()
    }, 1500)
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="email" value={userEmail} />

      {/* Welcome message */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-sm text-muted-foreground">Welcome! Just a few more details to get started.</p>
      </div>

      {/* Company ID */}
      <div className="space-y-2">
        <Label htmlFor="companyId" className="flex items-center">
          <Building className="h-4 w-4 mr-2" />
          Company ID
        </Label>
        <Input
          id="companyId"
          name="companyId"
          type="text"
          placeholder="Enter your company ID"
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          This helps us identify your organization and set up your workspace.
        </p>
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <Label className="flex items-center">
          <User className="h-4 w-4 mr-2" />
          Gender
        </Label>
        <RadioGroup name="gender" required disabled={isPending}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="font-normal">
              Male
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="font-normal">
              Female
            </Label>
          </div>
        </RadioGroup>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert>
          <AlertDescription className="text-green-600">
            Profile completed successfully! Redirecting to dashboard...
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isPending || state?.success}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Completing setup...
          </>
        ) : state?.success ? (
          "Redirecting..."
        ) : (
          "Complete Setup"
        )}
      </Button>
    </form>
  )
}
