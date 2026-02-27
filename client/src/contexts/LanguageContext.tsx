import React, { createContext, useContext, useEffect } from "react";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import i18n from "@/i18n";

export const LANGUAGES = [
    { code: "en", name: "English", native: "English" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "bn", name: "Bengali", native: "বাংলা" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
    { code: "mr", name: "Marathi", native: "मराठी" },
    { code: "ta", name: "Tamil", native: "தமிழ்" },
    { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    { code: "ml", name: "Malayalam", native: "മലയാളം" },
    { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
    { code: "ur", name: "Urdu", native: "اردو" },
    { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
    { code: "as", name: "Assamese", native: "অসমীয়া" },
    { code: "mai", name: "Maithili", native: "मैथिली" },
    { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
    { code: "ks", name: "Kashmiri", native: "كٲشُر" },
    { code: "ne", name: "Nepali", native: "नेपाली" },
    { code: "sd", name: "Sindhi", native: "سنڌي" },
    { code: "kok", name: "Konkani", native: "कोंकणी" },
    { code: "doi", name: "Dogri", native: "डोगरी" },
    { code: "mni", name: "Manipuri", native: "মেইতেই" },
    { code: "sa", name: "Sanskrit", native: "संस्कृत" },
];

interface LanguageContextType {
    language: string;
    languageCode: string;
    setLanguage: (code: string) => void;
    t: (key: string, options?: any) => string;
    translateAsync: (text: string) => Promise<string>;
    isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const { t, i18n: i18nInstance } = useStrictTranslation();
    const languageCode = i18nInstance.language || "en";
    const language = LANGUAGES.find((l) => l.code === languageCode)?.native || "English";
    const [isTranslating, setIsTranslating] = React.useState(false);

    // Keep localStorage in sync just in case, though i18next-browser-languagedetector handles it
    useEffect(() => {
        try { localStorage.setItem("healthify_lang", languageCode); } catch { }
    }, [languageCode]);

    const setLanguage = (code: string) => {
        // Set standard google translate cookie
        const cookieStr = `/auto/${code}`;
        document.cookie = `googtrans=${cookieStr}; max-age=31536000; path=/`;
        document.cookie = `googtrans=${cookieStr}; max-age=31536000; domain=${window.location.hostname}; path=/`;

        try { localStorage.setItem("healthify_lang", code); } catch { }
        i18nInstance.changeLanguage(code);

        // Reload the page to apply the translation instantly through the injected script
        window.location.reload();
    };

    const translateAsync = async (text: string): Promise<string> => {
        // Browser script handles everything natively when the text hits the DOM
        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, languageCode, setLanguage, t, translateAsync, isTranslating }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
}
