import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { translations, Language, TranslationKey } from "@/i18n/translations";

type LanguageContextType = {
  lang: Language;
  t: (key: TranslationKey) => string;
  setLang: (lang: Language) => void;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language | null;
      if (saved === "ar" || saved === "en") return saved;
    }
    return "ar";
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("language", newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[lang][key] || translations.ar[key] || key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, t, setLang, isRTL: lang === "ar" }}>
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
