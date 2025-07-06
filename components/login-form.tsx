"use client"

import { useActionState } from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginUser } from "@/app/actions/auth"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"

interface LoginFormProps {
  onForgotPassword?: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const { t, language } = useLanguage();
  const [state, action, isPending] = useActionState(loginUser, null);
  const router = useRouter();

  // Handle successful login
  useEffect(() => {
    async function handleSuccessfulLogin() {
      if (state?.success && state?.userData) {
        // Store user data in localStorage
        localStorage.setItem("user_data", JSON.stringify(state.userData));
        
        // Store session token
        if (state.sessionToken) {
          localStorage.setItem("auth_token", state.sessionToken);
          localStorage.setItem("user_session", "active");
          
          // Set cookies for server-side auth
          try {
            await fetch('/api/auth/cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: state.sessionToken, session: 'active' })
            });
          } catch (cookieError) {
            console.error("Failed to set auth cookies", cookieError);
          }
        }

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push(`/${language}/dashboard`);
        }, 1000);
      }
    }
    
    handleSuccessfulLogin();
  }, [state, router, language]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={language} />
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
              {t("login.form.signingin")}
          </>
        ) : (
          t("login.form.submit")
        )}
      </Button>

      <div className="text-center">
        <Button 
          variant="link" 
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={(e) => {
            e.preventDefault();
            if (onForgotPassword) {
              onForgotPassword();
            } else {
              router.push(`/${language}/forgot-password`);
            }
          }}
        >
          {t("login.form.forgotPassword")}
        </Button>
      </div>
    </form>
  )
}
