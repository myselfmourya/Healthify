import { mistralChat } from "./ai";

export interface QuizQuestion {
    id: string;
    domain: string;
    title: string;
    options: { label: string; value: any }[];
}

export interface Quiz {
    domain: string;
    questions: QuizQuestion[];
}

const DOMAIN_PROMPTS: Record<string, string> = {
    lifestyle: "daily habits, nutrition, activity levels, and sleep hygiene",
    mental: "stress, mood, cognitive function, and mental well-being",
    body_scan: "biometric precursors, cardiovascular health, metabolic markers, and hidden physical symptoms",
    heart: "cardiovascular risks, family history of heart disease, and physical exertion tolerance",
    diabetes: "sugar consumption, metabolic symptoms, weight management, and energy fluctuations"
};

export async function generateQuiz(domain: string, userProfile: any, history: string[] = []): Promise<Quiz> {
    const domainDesc = DOMAIN_PROMPTS[domain] || domain;

    // Convert history (asked question IDs) into a constraint
    const exclusionPrompt = history.length > 0
        ? `DO NOT repeat any of these previously asked question IDs: ${history.join(", ")}.`
        : "";

    const prompt = `Generate a robust, clinically-relevant 5-question health quiz for the domain: ${domainDesc}.
    User Profile: Age ${userProfile.age || 30}, Gender ${userProfile.gender || "Any"}, BMI ${userProfile.bmi || 24}.
    ${exclusionPrompt}
    
    Respond ONLY with a valid JSON object following this exact structure:
    {
      "domain": "${domain}",
      "questions": [
        {
          "id": "unique-slug-id",
          "title": "Clear, concise question?",
          "options": [
            {"label": "Option text", "value": 10},
            {"label": "Option text", "value": 20}
          ]
        }
      ]
    }
    
    Guidelines:
    - Questions must be professional, empathetic, and culturally relevant to India.
    - Options should have numeric values (1-100) representing risk or score weight.
    - Ensure IDs are unique and descriptive.`;

    try {
        const response = await mistralChat([
            { role: "system", content: "You are a clinical diagnostic AI specializing in robust health assessments. Respond only with valid JSON." },
            { role: "user", content: prompt }
        ], "mistral-small-latest", "json");

        const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error("Quiz Generation Failed:", err);
        // Fallback static quiz for the domain if AI fails
        return getFallbackQuiz(domain);
    }
}

function getFallbackQuiz(domain: string): Quiz {
    // Basic fallback to ensure UI never breaks
    return {
        domain,
        questions: [
            {
                id: `${domain}-fallback-1`,
                domain,
                title: "How would you rate your energy levels today?",
                options: [
                    { label: "High", value: 80 },
                    { label: "Moderate", value: 50 },
                    { label: "Low", value: 20 }
                ]
            }
        ]
    };
}
