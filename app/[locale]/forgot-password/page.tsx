"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }
    
    setIsSubmitting(true);
    setStatus('idle');
    
    try {
      // Simular envío de correo para restablecer contraseña
      // En una implementación real, esto se conectaría con una API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus('success');
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("forgotPassword.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("forgotPassword.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.form.email")}</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder={t("login.form.placeholderemail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>{t("forgotPassword.error")}</AlertDescription>
              </Alert>
            )}
            
            {status === 'success' && (
              <Alert>
                <AlertDescription className="text-green-600">
                  {t("forgotPassword.success")}
                </AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("forgotPassword.sending")}
                </>
              ) : (
                t("forgotPassword.submit")
              )}
            </Button>
            
            <div className="text-center">
              <Link href={`/${language}`} className="text-sm text-blue-600 hover:text-blue-800">
                {t("forgotPassword.backToLogin")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
