import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "ar" | "en";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  isRTL: boolean;
  t: (arText: string, enText: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  setLang: () => {},
  isRTL: true,
  t: (ar) => ar,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("elnour_lang");
    return saved === "en" ? "en" : "ar";
  });

  const isRTL = lang === "ar";

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("elnour_lang", newLang);
  };

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const t = (arText: string, enText: string) => (lang === "ar" ? arText : enText);

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
