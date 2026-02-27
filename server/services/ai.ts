const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "d6Qm3z279EoVjzZ0Dxglpak3mClmLDkO";
const DEFAULT_MODEL = "mistral-small-latest";

// --- MIDDLEWARE & CACHE ---
const translationCache = new Map<string, string>();
let apiCallCount = 0;
let lastReset = Date.now();
const RATE_LIMIT_PER_MIN = 30;

function checkRateLimit() {
    const now = Date.now();
    if (now - lastReset > 60000) {
        apiCallCount = 0;
        lastReset = now;
    }
    if (apiCallCount >= RATE_LIMIT_PER_MIN) {
        console.warn("[Rate Limit] API calls throttled to protect key.");
        throw new Error("AI service is currently busy. Please try again in a minute.");
    }
    apiCallCount++;
}

interface AIMessage {
    role: "system" | "user" | "assistant";
    content: string | any[];
}

interface MistralResponse {
    choices: { message: { content: string } }[];
}

export async function mistralChat(messages: AIMessage[], model = DEFAULT_MODEL, format?: "json"): Promise<string> {
    checkRateLimit();
    console.log(`[AI] Invoking Mistral model: ${model}, Format: ${format || 'text'}`);

    try {
        const body: Record<string, any> = { model, messages };
        if (format === "json") {
            body.response_format = { type: "json_object" };
        }

        const res = await fetch(`https://api.mistral.ai/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60000),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Mistral HTTP ${res.status}: ${errText}`);
        }

        const data: MistralResponse = await res.json() as MistralResponse;
        console.log(`[AI] Response successful for ${model}`);
        return data.choices?.[0]?.message?.content || "";
    } catch (err: unknown) {
        console.error("[Mistral] Error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`AI unavailable: ${msg}`);
    }
}
export async function healthAssistantChat(
    userMessage: string,
    history: any[],
    userName: string,
    userProfile?: Record<string, unknown>,
    imageUrl?: string
): Promise<string> {
    const systemPrompt = `You are MIYA, an empathetic AI health assistant for the Healthify app, helping rural Indian users.
User name: ${userName}
${userProfile ? `Profile: Age ${userProfile.age}, Gender: ${userProfile.gender}, Conditions: ${(userProfile.diseases as string[])?.join(", ") || "None"}` : ""}

Rules:
- Always respond in the same language the user writes in
- Add a brief medical disclaimer when suggesting treatments
- Be empathetic, clear, and avoid complex medical jargon
- Suggest seeing a doctor for serious concerns
- Provide actionable, practical advice suitable for rural settings
- Keep responses concise but complete
- If an image is provided, analyze it carefully.`;

    const formattedHistory = history.map(m => {
        if (m.imageUrl) {
            return {
                role: m.role,
                content: [
                    { type: "text", text: m.content },
                    { type: "image_url", image_url: { url: m.imageUrl } }
                ]
            };
        }
        return { role: m.role, content: m.content };
    });

    const currentMessage: AIMessage = imageUrl
        ? {
            role: "user",
            content: [
                { type: "text", text: userMessage },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        }
        : { role: "user", content: userMessage };

    const messages: AIMessage[] = [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        currentMessage,
    ];

    // Use pixtral model if there are any images in the conversation
    const hasImages = imageUrl || history.some(m => m.imageUrl);
    const model = hasImages ? "pixtral-12b-2409" : DEFAULT_MODEL;

    return mistralChat(messages, model);
}

export async function symptomCheck(
    symptoms: string,
    imageDescription: string | null,
    userProfile?: Record<string, unknown>
): Promise<{
    condition: string;
    causes: string[];
    medicines: string[];
    precautions: string[];
    doctorType: string;
    severity: "mild" | "moderate" | "severe";
}> {
    const prompt = `Analyze these symptoms and respond ONLY with valid JSON (no markdown):
Symptoms: ${symptoms}
${imageDescription ? `Image description: ${imageDescription}` : ""}
${userProfile ? `Patient: Age ${userProfile.age}, Conditions: ${(userProfile.diseases as string[])?.join(", ") || "None"}` : ""}

Respond with this exact JSON structure:
{
  "condition": "Most likely condition name",
  "causes": ["cause1", "cause2", "cause3"],
  "medicines": ["medicine1 - dosage", "medicine2 - dosage"],
  "precautions": ["precaution1", "precaution2", "precaution3"],
  "doctorType": "Type of specialist to see",
  "severity": "mild|moderate|severe"
}`;

    const response = await mistralChat([
        { role: "system", content: "You are a medical AI. Respond only with valid JSON, no markdown code blocks." },
        { role: "user", content: prompt },
    ], DEFAULT_MODEL, "json");

    try {
        // Strip any markdown code blocks if present
        const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleaned);
    } catch {
        return {
            condition: "Unable to determine",
            causes: ["Please describe symptoms in more detail"],
            medicines: ["Consult a doctor before taking any medication"],
            precautions: ["Rest", "Stay hydrated", "Monitor symptoms"],
            doctorType: "General Physician",
            severity: "moderate",
        };
    }
}

export async function predictHealth(profile: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    diseases: string[];
    recentSymptoms?: string[];
    records?: string[];
}): Promise<{
    bmi: number;
    bmiCategory: string;
    diabetesRisk: number;
    heartRisk: number;
    bpRisk: number;
    suggestions: string[];
    alerts: string[];
}> {
    const bmi = profile.height > 0 ? profile.weight / Math.pow(profile.height / 100, 2) : 0;
    const bmiRound = Math.round(bmi * 10) / 10;

    const prompt = `Calculate health risk scores for this patient (respond ONLY with valid JSON):
Age: ${profile.age}, Gender: ${profile.gender}, BMI: ${bmiRound}
Existing conditions: ${profile.diseases?.join(", ") || "None"}
Recent symptoms: ${profile.recentSymptoms?.join(", ") || "None"}
Recent records: ${profile.records?.join(", ") || "None"}

Respond with this exact JSON:
{
  "diabetesRisk": <number 0-100>,
  "heartRisk": <number 0-100>,
  "bpRisk": <number 0-100>,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "alerts": ["alert if high risk, else empty array"]
}`;

    const response = await mistralChat([
        { role: "system", content: "You are a medical risk assessment AI. Respond only with valid JSON, no markdown." },
        { role: "user", content: prompt },
    ], DEFAULT_MODEL, "json");

    const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";

    try {
        const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return { bmi: bmiRound, bmiCategory, ...parsed };
    } catch {
        return {
            bmi: bmiRound,
            bmiCategory,
            diabetesRisk: 20,
            heartRisk: 15,
            bpRisk: 18,
            suggestions: ["Maintain a balanced diet", "Exercise 30 minutes daily", "Regular health checkups"],
            alerts: [],
        };
    }
}

export async function translateText(
    text: string,
    targetLanguage: string,
    context = "healthcare app UI"
): Promise<string> {
    if (!text || !text.trim()) return text;
    if (targetLanguage === 'en' || targetLanguage === 'English') return text;

    const cacheKey = `${targetLanguage}:${text.length}:${text.substring(0, 50)}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
    }

    const prompt = `Translate the following ${context} text to ${targetLanguage}. 
Return ONLY the translated text, nothing else.
Preserve any special characters, numbers, or formatting.
Text: ${text}`;

    try {
        const translated = await mistralChat([
            { role: "system", content: `You are an expert translator specializing in healthcare, Indian languages, and medical terminology. Translate accurately and naturally. Do NOT translate chemical names or dosages.` },
            { role: "user", content: prompt },
        ]);
        translationCache.set(cacheKey, translated.trim());
        return translated.trim();
    } catch (err) {
        console.warn("[Translation] Fallback to original text due to error.", err);
        return text;
    }
}

export async function generateHealthNews(): Promise<Array<{
    title: string;
    description: string;
    category: string;
    content: string;
    publishedAt: string;
    source: string;
    url: string;
}>> {
    const prompt = `Generate 8 realistic, current Indian health news articles (respond ONLY with valid JSON array):
 Each article should be about different health topics relevant to India (diabetes, heart disease, ayurveda, government health schemes, monsoon diseases, nutrition, etc.)

JSON format:
[
  {
    "title": "Article title",
    "description": "2-sentence summary",
    "category": "Category name",
    "content": "Full article in 3-4 paragraphs",
    "publishedAt": "2026-02-25T10:00:00Z",
    "source": "Health ET / AIIMS / Ministry of Health",
    "url": "https://health.economictimes.indiatimes.com"
  }
]`;

    const response = await mistralChat([
        { role: "system", content: "You are a health news journalist in India. Generate realistic, factual-sounding health news. Respond only with valid JSON array." },
        { role: "user", content: prompt },
    ], DEFAULT_MODEL, "json");

    try {
        const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleaned);
    } catch {
        return [
            {
                title: "Government Expands Ayushman Bharat Coverage to 20 Crore More Families",
                description: "The PM-JAY scheme will now cover additional families in rural areas, offering ₹5 lakh health coverage per year.",
                category: "Policy",
                content: "The government has announced an major expansion of the Ayushman Bharat Pradhan Mantri Jan Arogya Yojana scheme to cover an additional 20 crore families across India. The expansion focuses primarily on rural and semi-urban areas where access to quality healthcare remains limited.\n\nBeneficiaries will receive up to ₹5 lakh in annual health coverage, usable at any empanelled government or private hospital across India. The scheme covers over 1,500 medical procedures including complex surgeries.\n\nHealth officials note this represents a significant step toward Universal Health Coverage by 2030.",
                publishedAt: "2026-02-25T08:00:00Z",
                source: "Ministry of Health",
                url: "https://health.economictimes.indiatimes.com",
            },
        ];
    }
}


