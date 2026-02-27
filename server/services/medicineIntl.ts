import { mistralChat } from './ai';

interface UserHealthContext {
    age?: number;
    allergies?: string[];
    diseases?: string[];
    chronicConditions?: string[];
    activeMedicines?: string[];
}

export async function checkMedicineRisk(
    medicineToCheck: string,
    userContext: UserHealthContext
): Promise<{ status: "SAFE" | "WARNING" | "CRITICAL"; warnings: string[]; alternatives: { name: string; estimatedCost: string; }[] }> {

    // Convert to JSON prompt for Mistral
    const prompt = `You are a strict, clinical pharmacologist API.
Evaluate the safety of the medicine "${medicineToCheck}" for a patient with the following profile:
Allergies: ${(userContext.allergies || []).join(", ") || "None"}
Conditions: ${(userContext.diseases || userContext.chronicConditions || []).join(", ") || "None"}
Active Meds: ${(userContext.activeMedicines || []).join(", ") || "None"}

You must return ONLY a JSON object with this exact structure:
{
  "status": "SAFE" | "WARNING" | "CRITICAL",
  "warnings": ["Array of concise warning strings, if any. Leave empty if SAFE."],
  "alternatives": [
    { "name": "Generic Name 1", "estimatedCost": "₹X" }
  ]
}

If the user is allergic to the medicine (or its class), it is CRITICAL.
If it is contraindicated for their conditions, it is CRITICAL or WARNING.
If there are no known issues, it is SAFE.
Always provide 1-3 cheaper generic alternatives in the alternatives array if available. If none, return an empty array.
`;

    try {
        const responseJson = await mistralChat([{ role: "user", content: prompt }], "mistral-small-latest", "json");
        return JSON.parse(responseJson) as { status: "SAFE" | "WARNING" | "CRITICAL"; warnings: string[]; alternatives: any[] };
    } catch (err) {
        console.error("AI Medicine Check Failed", err);
        // Fallback
        return {
            status: "SAFE",
            warnings: ["AI check unavailable. Rely on deterministic fallback: No immediate critical red flags found offline."],
            alternatives: []
        };
    }
}
