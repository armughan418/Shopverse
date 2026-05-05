// filepath: frontend/src/utils/LanguageContext.js
import { useCallback } from "react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, getTranslation } from "./translations";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to English
    return localStorage.getItem("language") || "en";
  });

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ur" : "en"));
  };

  const t = useCallback(
    (key) => {
      return getTranslation(language, key);
    },
    [language],
  );

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isUrdu: language === "ur",
    isEnglish: language === "en",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
