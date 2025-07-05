import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { LanguageProvider } from "@/contexts/language-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WorkWear Sizes App",
  description: "Manage your work clothing sizes with precision",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
         <LanguageProvider>
            <GoogleOAuthProvider clientId="806133975237-vscpf295q14u2p73p7v446k76l3e4164.apps.googleusercontent.com">
              {children}
            </GoogleOAuthProvider>
         </LanguageProvider>
      </body>
    </html>
  )
}