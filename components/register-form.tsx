"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registerUser } from "@/app/actions/auth"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function RegisterForm() {
  const { t, language } = useLanguage();
  const [state, action, isPending] = useActionState(registerUser, null)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={language} />
      <div className="space-y-2">
        <Label htmlFor="name">{t("register.form.name")}</Label>
        <Input id="name" name="name" type="text" placeholder={t("register.form.placeholdername")} required disabled={isPending} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("register.form.email")}</Label>
        <Input id="email" name="email" type="email" placeholder={t("register.form.placeholderemail")} required disabled={isPending} />
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

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("register.form.creating")}
          </>
        ) : (
          t("register.form.submit")
        )}
      </Button>
    </form>
  )
}
