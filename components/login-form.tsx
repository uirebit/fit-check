"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginUser } from "@/app/actions/auth"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function LoginForm() {
  const { t } = useLanguage();
  const [state, action, isPending] = useActionState(loginUser, null)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("login.form.email")}</Label>
        <Input id="email" name="email" type="email" placeholder={t("login.form.placeholderemail")} required disabled={isPending} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("login.form.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder= {t("login.form.placeholderpassword")}
          required
          disabled={isPending}
        />
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
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
              {t("login.form.signingin")}
          </>
        ) : (
          t("login.form.submit")
        )}
      </Button>

      <div className="text-center">
        <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800">
          {t("login.form.forgotPassword")}?
        </Button>
      </div>
    </form>
  )
}
