/**
 * Context Intelligence Engine
 * 
 * Provides rule-based outbreak detection based on geographical location
 * and insurance scheme matching based on explicit user eligibility criteria.
 */

// ── HYPERLOCAL OUTBREAK SIMULATOR ──────────────────────────────────────────

// In a real app, this would hit CDC/WHO/Local endpoints based on lat/lng.
// For this architecture, we use deterministic hardcoded regional trends based on month/location keyword.
const REGIONAL_TRENDS: Record<string, { disease: string; radius: string; riskLevel: string; recommendation: string }[]> = {
    "mumbai": [
        { disease: "Malaria", radius: "10km", riskLevel: "HIGH", recommendation: "Ensure use of mosquito nets and repellents. Avoid stagnant water." },
        { disease: "Typhoid", radius: "5km", riskLevel: "MODERATE", recommendation: "Boil water before drinking. Avoid street food." }
    ],
    "delhi": [
        { disease: "Asthma Exacerbation", radius: "Citywide", riskLevel: "CRITICAL", recommendation: "AQI is severe. Wear N95 masks outdoors and use air purifiers." }
    ],
    "kerala": [
        { disease: "Dengue Fever", radius: "15km", riskLevel: "HIGH", recommendation: "Cases rising rapidly. Use repellents and clear standing water near your home." }
    ]
};

export function getLocalOutbreaks(location: string) {
    const locKey = location.toLowerCase();

    // Find matching region
    for (const [key, alerts] of Object.entries(REGIONAL_TRENDS)) {
        if (locKey.includes(key)) {
            return alerts;
        }
    }

    // Default fallback if no specific region matched
    return [
        { disease: "Seasonal Flu", radius: "20km", riskLevel: "MODERATE", recommendation: "Flu season is starting. Consider getting vaccinated." }
    ];
}

const INSURANCE_SCHEMES = [
    {
        id: "pmjay",
        name: "Ayushman Bharat (PM-JAY)",
        type: "Government",
        eligibility: ["Income < ₹2,00,000", "BPL/SECC Database"],
        benefit: "Free treatment at empaneled public & private hospitals.",
        coverage: "₹5,00,000 / family",
        premium: "₹0",
        rating: 4.8
    },
    {
        id: "cghs",
        name: "Central Government Health Scheme (CGHS)",
        type: "Government",
        eligibility: ["Central Govt Employee / Pensioner"],
        benefit: "Comprehensive care including OPD and medicines.",
        coverage: "Unlimited (Subject to rules)",
        premium: "Varies by pay scale",
        rating: 4.5
    },
    {
        id: "star-health-comprehensive",
        name: "Star Health Comprehensive",
        type: "Private",
        eligibility: ["No age limit for adults", "Pre-existing covered after 3 yrs"],
        benefit: "No room rent capping, air ambulance cover.",
        coverage: "₹10,00,000",
        premium: "~₹15,000/yr",
        rating: 4.2
    },
    {
        id: "care-health-supreme",
        name: "Care Supreme",
        type: "Private",
        eligibility: ["Adults 18+"],
        benefit: "Cumulative Bonus up to 500%, unlimited recharge.",
        coverage: "₹7,00,000",
        premium: "~₹12,000/yr",
        rating: 4.4
    },
    {
        id: "hdfc-optima-secure",
        name: "HDFC Ergo Optima Secure",
        type: "Private",
        eligibility: ["Adults 18-65 yrs"],
        benefit: "4X coverage from day 1, zero deduction on consumables.",
        coverage: "₹10,00,000",
        premium: "~₹18,000/yr",
        rating: 4.7
    }
];

export function getInsuranceSchemes() {
    return INSURANCE_SCHEMES;
}

// ── STRUCTURED CLINICAL TRIAGE ENGINE ────────────────────────────────────────

const RED_FLAGS = [
    "chest pain", "shortness of breath", "difficulty breathing", "severe bleeding",
    "unconscious", "stroke", "paralysis", "sudden weakness", "suicidal", "severe crushing pain",
    "coughing up blood"
];

const YELLOW_FLAGS = [
    "persistent fever", "high fever", "severe abdominal pain", "dehydration",
    "confusion", "dizziness", "persistent vomiting", "blood in stool", "broken bone",
    "joint dislocation"
];

/**
 * Evaluates symptoms to generate a definitive clinical triage priority.
 * Used as a safeguard to bypass AI reasoning when critical symptoms are detected.
 */
export function evaluateTriagePriority(symptoms: string | string[]) {
    const symptomStr = (Array.isArray(symptoms) ? symptoms.join(" ") : symptoms).toLowerCase();

    for (const flag of RED_FLAGS) {
        if (symptomStr.includes(flag)) {
            return {
                level: "RED",
                priority: "CRITICAL",
                action: "Seek immediate emergency medical attention or call emergency services right away.",
                triggeredBy: flag
            };
        }
    }

    for (const flag of YELLOW_FLAGS) {
        if (symptomStr.includes(flag)) {
            return {
                level: "YELLOW",
                priority: "URGENT",
                action: "Consult a doctor as soon as possible. Do not wait for symptoms to worsen.",
                triggeredBy: flag
            };
        }
    }

    return {
        level: "GREEN",
        priority: "ROUTINE",
        action: "Self-care and monitor symptoms. Consult a doctor if symptoms persist or worsen.",
        triggeredBy: "none"
    };
}

