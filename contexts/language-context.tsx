"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import en from "@/app/locales/en";
import es from "@/app/locales/es";  
import pt from "@/app/locales/pt";

type Language = "en" | "es" | "pt";

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {en,es,pt};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] as Language;

  const language: Language = ["en", "es", "pt"].includes(segment) ? segment : "en";

  const t = (key: string): string => {
    const value = translations[language]?.[key];
    return value ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type { Language };
