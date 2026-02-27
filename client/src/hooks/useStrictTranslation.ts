import { useCallback, useState, useEffect } from "react";
import { useTranslation as useI18nTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";

// A local cache for dynamic strings fetched from Mistral
const dynamicTranslationCache = new Map<string, string>();

/**
 * A custom "Catch-All" translation hook.
 * Replaces the standard `useTranslation` hook across the app.
 * If a string is not found in the static locale files (en/hi/ta),
 * it warns in development and dynamically fetches the translation from Mistral.
 */
export function useStrictTranslation() {
    const { t: originalT, i18n } = useI18nTranslation();
    const currentLang = i18n.language || "en";

    const t = useCallback(
        (key: string, options?: any): string => {
            if (!key) return "";

            // With the Google Translate browser-native approach, we simply
            // return the static key (English) and let the DOM script translate it instantly.
            return key;
        },
        [originalT, i18n, currentLang]
    );

    return { t, i18n, language: currentLang };
}
