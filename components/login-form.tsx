"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

interface LoginFormProps {
  onForgotPassword?: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Función para manejar el envío del formulario con NextAuth
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Obtener los datos del formulario
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    console.log("Form data:", { email, hasPassword: !!password, password: password?.substring(0, 3) + "..." }); // Debug log  
      
    // Also check what the form actually contains
    console.log("All form data:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      // Usar NextAuth para iniciar sesión
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password
      });

      console.log("SignIn result:", result); // Debug log
      
      if (result?.error) {
        // Mostrar error de autenticación
        setError(t("login.form.invalidCredentials"));
      } else if (result?.ok) {
        // Éxito: mostrar mensaje de éxito y preparar redirección
        setSuccess(true);
        
        // Redirigir al dashboard después de un breve retraso
        setTimeout(() => {
          router.push(`/${language}/dashboard`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      setError(t("login.form.serverError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="locale" value={language} />
      <div className="space-y-2">
        <Label htmlFor="email">{t("login.form.email")}</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder={t("login.form.placeholderemail")} 
          required 
          disabled={isLoading} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("login.form.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={t("login.form.placeholderpassword")}
          required
          disabled={isLoading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">
            {t("login.form.loginSuccess")}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
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