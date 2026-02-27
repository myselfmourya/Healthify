import { mistralChat } from "./ai";

// In-memory cache for translations (In production, use Redis)
// Key format: `${languageCode}:${hashOfString}`
const translationCache = new Map<string, string>();

/**
 * Creates a deterministic hash for a string to use as a cache key.
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

/**
 * The strict medical prompt requested for Zero-Leakage Mistral translations.
 */
function getMedicalTranslationPrompt(targetLanguage: string, text: string): string {
    return `You are an expert medical translator. Translate the following text into ${targetLanguage}.
CRITICAL: Translate every single word of the descriptive text.
CRITICAL: DO NOT translate or transliterate chemical names of medicines or brand names.
CRITICAL: Preserve formatting perfectly. If there is a variable like {userName} or {date}, leave it exactly as is.
CRITICAL: Keep dosage measurements (mg, ml, mcg, %, bpm) in standard English characters, but translate the instructions around them.

Text to translate:
"${text}"

Return ONLY the translated text, nothing else.`;
}

/**
 * Translates a single string using Mistral with caching and the strict medical prompt.
 */
export async function translateTextStrict(text: string, targetLanguage: string): Promise<string> {
    if (!text || !text.trim()) return text;
    if (targetLanguage === 'en') return text; // Default language

    const cacheKey = `${targetLanguage}:${hashString(text)}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
    }

    try {
        const prompt = getMedicalTranslationPrompt(targetLanguage, text);
        // We need to expose mistralChat from ai.ts or re-implement the fetch here.
        // Assuming mistralChat takes (messages)
        const translated = await mistralChat([
            { role: "system", content: "You are an expert medical translator adhering strictly to the provided rules." },
            { role: "user", content: prompt },
        ]);

        const cleanedTranslation = translated.trim();
        translationCache.set(cacheKey, cleanedTranslation);
        return cleanedTranslation;
    } catch (err) {
        console.error("[Translation Proxy] Error translating text:", err);
        return text; // Fallback to original text on error to prevent breaking the app
    }
}

/**
 * Recursively intercepts and translates all string values within a JSON object/array.
 * Skips specific keys (like 'id', 'url', 'image', 'type', 'color', 'icon').
 */
export async function translateDeepJSON(data: any, targetLanguage: string): Promise<any> {
    if (targetLanguage === 'en') return data;
    if (data === null || data === undefined) return data;

    const skipKeys = new Set(['id', 'url', 'image', 'icon', 'color', 'publishedAt', 'date', 'time', 'createdAt', 'updatedAt']);

    if (Array.isArray(data)) {
        return Promise.all(data.map(item => translateDeepJSON(item, targetLanguage)));
    }

    if (typeof data === 'object') {
        const translatedObj: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (skipKeys.has(key)) {
                translatedObj[key] = value;
                continue;
            }

            if (typeof value === 'string') {
                // Short strings or highly technical non-translatable text logic could go here if needed.
                translatedObj[key] = await translateTextStrict(value, targetLanguage);
            } else if (typeof value === 'object') {
                translatedObj[key] = await translateDeepJSON(value, targetLanguage);
            } else {
                translatedObj[key] = value;
            }
        }
        return translatedObj;
    }

    return data;
}
