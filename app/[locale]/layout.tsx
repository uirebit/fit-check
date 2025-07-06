import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LanguageProvider } from "@/contexts/language-context";
import LanguageSelector from "@/components/language-selector";

const inter = Inter({ subsets: ["latin"] });

// Metadata translations for SEO
const metadataTranslations = {
  en: {
    title: "WorkWear Sizes App",
    description: "Manage your work clothing sizes with precision",
  },
  es: {
    title: "App de Tallas de Ropa de Trabajo",
    description: "Gestiona las tallas de tu ropa de trabajo con precisión",
  },
  pt: {
    title: "App de Tamanhos de Roupa de Trabalho",
    description: "Gerencie os tamanhos da sua roupa de trabalho com precisão",
  }
};

// Generate metadata based on locale
export async function generateMetadata({ 
  params 
}: { 
  params: { locale: string } 
}): Promise<Metadata> {
  // Use Promise.resolve to properly await the params
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale as 'en' | 'es' | 'pt';
  
  // Use the appropriate translations
  const { title, description } = metadataTranslations[locale] || metadataTranslations.en;
  
  return {
    title,
    description,
    generator: "v0.dev",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en': '/en',
        'es': '/es',
        'pt': '/pt',
      },
    },
  };
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Use Promise.resolve to properly await the params
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale;
  
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <LanguageProvider>
          <GoogleOAuthProvider clientId="806133975237-vscpf295q14u2p73p7v446k76l3e4164.apps.googleusercontent.com">
            <header className="flex justify-end p-4">
              <LanguageSelector />
            </header>
            <main>{children}</main>
          </GoogleOAuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
