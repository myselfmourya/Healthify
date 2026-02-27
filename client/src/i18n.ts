import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    // Load translations via http backend (from public/locales)
    .use(HttpBackend)
    // Detect user language via localStorage, navigator, etc.
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: [
            'en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa',
            'ur', 'or', 'as', 'mai', 'sat', 'ks', 'ne', 'sd', 'kok', 'doi', 'mni', 'sa'
        ],
        ns: ['translation'],

        defaultNS: 'translation',

        // Automatically use the first matched language
        nonExplicitSupportedLngs: true,

        // Backend options for fetching JSONs
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'healthify_lang',
        },

        interpolation: {
            escapeValue: false, // React already safeguards from XSS
            format: (value, format, lng) => {
                if (format === 'number') return new Intl.NumberFormat(lng).format(value);
                return value;
            }
        },

        react: {
            useSuspense: true, // Show fallback UI while translations load
        },

        // Debug info in dev mode
        debug: process.env.NODE_ENV === 'development',
    });

export default i18n;
