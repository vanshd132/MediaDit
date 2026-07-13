"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, translations, TranslationSchema } from "@/lib/translations";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationSchema;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLang);
      
      // Update URL query parameters so search crawlers can index language pages
      const url = new URL(window.location.href);
      url.searchParams.set("lang", newLang);
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryLang = params.get("lang") as Language;
      const storedLang = localStorage.getItem("lang") as Language;
      
      const supportedLanguages: Language[] = ["en", "es", "fr", "de", "pt", "hi"];
      
      // 1. Prioritize URL query parameters
      if (queryLang && supportedLanguages.includes(queryLang)) {
        setLangState(queryLang);
        localStorage.setItem("lang", queryLang);
        return;
      }
      
      // 2. Prioritize localStorage values
      if (storedLang && supportedLanguages.includes(storedLang)) {
        setLangState(storedLang);
        // Sync URL query parameter
        const url = new URL(window.location.href);
        url.searchParams.set("lang", storedLang);
        window.history.replaceState({}, "", url.pathname + url.search);
        return;
      }
      
      // 3. Fallback to navigator browser settings
      const browserLocale = navigator.language.split("-")[0] as Language;
      if (browserLocale && supportedLanguages.includes(browserLocale)) {
        setLangState(browserLocale);
        localStorage.setItem("lang", browserLocale);
        const url = new URL(window.location.href);
        url.searchParams.set("lang", browserLocale);
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, []);

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
