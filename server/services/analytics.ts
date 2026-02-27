/**
 * Health Analytics Engine
 * 
 * This service provides deterministic, rule-based medical calculations.
 * It prevents AI hallucinations by computing strict mathematical bounds
 * for risks, scores, and recommendations before any LLM formatting.
 */

export interface UserProfileParams {
    age?: number;
    gender?: 'Male' | 'Female' | 'Other' | string;
    bmi: number;
    bloodPressure?: string; // e.g. "120/80"
    bloodSugar?: number;    // mg/dL fasting
    activityLevel?: string;
    sleepHours?: number;
    smokingStatus?: string;
    alcoholStatus?: string;
    familyHistory?: string[]; // array of diseases
}

// ── HEALTH CREDIT SCORE ──────────────────────────────────────────────
export function calculateHealthCreditScore(user: UserProfileParams): { score: number; trend: string; explanation: string; weightBreakdown: Record<string, number> } {
    let score = 800; // Baseline good score out of 1000
    let deductions = 0;
    let additions = 0;
    const weightBreakdown: Record<string, number> = {};

    // BMI (Optimal: 18.5 - 24.9)
    if (user.bmi > 0) {
        if (user.bmi > 25 && user.bmi <= 29.9) { deductions += 30; weightBreakdown['Overweight BMI'] = -30; }
        if (user.bmi >= 30) { deductions += 60; weightBreakdown['Obese BMI'] = -60; }
        if (user.bmi < 18.5) { deductions += 20; weightBreakdown['Underweight BMI'] = -20; }
        if (user.bmi >= 18.5 && user.bmi <= 24.9) { additions += 40; weightBreakdown['Optimal BMI'] = +40; }
    }

    // Activity
    if (user.activityLevel) {
        if (user.activityLevel.toLowerCase() === 'sedentary') { deductions += 40; weightBreakdown['Sedentary Lifestyle'] = -40; }
        if (user.activityLevel.toLowerCase() === 'active') { additions += 50; weightBreakdown['Active Lifestyle'] = +50; }
    }

    // Sleep (Optimal: 7-9 hours)
    if (user.sleepHours) {
        if (user.sleepHours < 6) { deductions += 30; weightBreakdown['Poor Sleep Duration'] = -30; }
        if (user.sleepHours >= 7 && user.sleepHours <= 9) { additions += 30; weightBreakdown['Optimal Sleep'] = +30; }
    }

    // Vitals (Blood Pressure)
    if (user.bloodPressure) {
        const [sys, dia] = user.bloodPressure.split('/').map(Number);
        if (sys >= 140 || dia >= 90) { deductions += 80; weightBreakdown['Hypertension Stage 2'] = -80; }
        else if (sys >= 130 || dia >= 80) { deductions += 40; weightBreakdown['Hypertension Stage 1'] = -40; }
        else if (sys < 120 && dia < 80 && sys > 90) { additions += 50; weightBreakdown['Ideal Blood Pressure'] = +50; }
    }

    // Habits
    if (user.smokingStatus && user.smokingStatus.toLowerCase().includes('yes')) { deductions += 100; weightBreakdown['Active Smoking'] = -100; }
    if (user.alcoholStatus && ["regular", "heavy"].includes(user.alcoholStatus.toLowerCase())) { deductions += 50; weightBreakdown['Heavy/Regular Alcohol'] = -50; }

    const finalScore = Math.max(300, Math.min(1000, score + additions - deductions));

    let explanation = `Your score is ${finalScore}. Keep maintaining a balanced diet and regular exercise.`;
    if (finalScore >= 850) explanation = "Excellent preventive behavior. You are in the top 10% of users.";
    else if (finalScore >= 700) explanation = "Good health habits tracked. A few lifestyle tweaks can boost your score further.";
    else if (finalScore < 600) explanation = "Warning: Multiple risk factors detected. Consider scheduling a preventive checkup.";

    return {
        score: finalScore,
        trend: additions > deductions ? "UP" : "DOWN",
        explanation,
        weightBreakdown
    };
}

// ── EARLY SILENT DISEASE RADAR ──────────────────────────────────────────────
export function calculateDiseaseRisks(user: UserProfileParams) {
    // 1. Cardiovascular Risk (Simplified Framingham proxy)
    let cvdRisk = 2.0; // Base 2%
    const cvdBreakdown: Record<string, number> = { 'Base Risk': 2.0 };

    // Parse values safely with bounds checking
    const age = Math.min(120, Math.max(1, parseInt(user.age as any) || 30));
    const bmi = Math.min(60, Math.max(10, parseFloat(user.bmi as any) || 24));

    // Age factor
    if (age > 45) { cvdRisk += (age - 45) * 0.5; cvdBreakdown['Age Factor'] = (age - 45) * 0.5; }
    if (user.gender === "Male" && age > 40) { cvdRisk += 1.5; cvdBreakdown['Gender/Age Factor'] = 1.5; }

    // BP Factor
    if (user.bloodPressure) {
        const [sys] = user.bloodPressure.split('/').map(Number);
        if (sys > 130) { cvdRisk += 3.0; cvdBreakdown['Elevated BP'] = 3.0; }
        if (sys > 140) { cvdRisk += 5.0; cvdBreakdown['High BP'] = 5.0; }
    }

    // Habits
    if (user.smokingStatus && user.smokingStatus.toLowerCase().includes('yes')) { cvdRisk += 10.0; cvdBreakdown['Smoking'] = 10.0; }
    if (user.bmi > 30) { cvdRisk += 4.0; cvdBreakdown['Obesity'] = 4.0; }

    // Family History
    const hasHeartHistory = user.familyHistory?.some(d => d.toLowerCase().includes('heart'));
    if (hasHeartHistory) { cvdRisk += 8.0; cvdBreakdown['Family History'] = 8.0; }

    // 2. Type 2 Diabetes Risk (ADA Risk logic proxy)
    let t2dRisk = 1.0;
    const t2dBreakdown: Record<string, number> = { 'Base Risk': 1.0 };

    if (user.bmi >= 25) { t2dRisk += 5.0; t2dBreakdown['Overweight'] = 5.0; }
    if (user.bmi >= 30) { t2dRisk += 8.0; t2dBreakdown['Obese'] = 8.0; }
    if (user.age && user.age >= 40) { t2dRisk += 4.0; t2dBreakdown['Age Factor'] = 4.0; }
    if (user.activityLevel && user.activityLevel.toLowerCase() === 'sedentary') { t2dRisk += 3.0; t2dBreakdown['Sedentary Activity'] = 3.0; }

    const hasDiabetesHistory = user.familyHistory?.some(d => d.toLowerCase().includes('diabetes'));
    if (hasDiabetesHistory) { t2dRisk += 10.0; t2dBreakdown['Family History'] = 10.0; }

    // Cap risks
    cvdRisk = Math.min(Math.max(cvdRisk, 0), 99);
    t2dRisk = Math.min(Math.max(t2dRisk, 0), 99);

    return {
        cardiovascularPercentage: Math.round(cvdRisk),
        cvdBreakdown,
        type2DiabetesPercentage: Math.round(t2dRisk),
        t2dBreakdown,
        status: (cvdRisk > 15 || t2dRisk > 15) ? "WARNING" : "CLEAR"
    };
}

// ── MENTAL COMPANION SCORING (PHQ-2 / GAD-2 Proxy) ─────────────────────────
export function calculateMentalHealthScore(moodLogs: number[], sleepHoursAvg: number) {
    // Mood logs from 1 (terrible) to 5 (excellent)
    let score = 50; // Base neutral
    const breakdown: Record<string, number> = { 'Base Neutral': 50 };

    if (moodLogs.length > 0) {
        const avgMood = moodLogs.reduce((a, b) => a + b, 0) / moodLogs.length;
        score = avgMood * 20; // Scale 1-5 to 20-100
        breakdown['Mood Logs Scale'] = score;
        delete breakdown['Base Neutral'];
    }

    if (sleepHoursAvg < 5) { score -= 15; breakdown['Poor Sleep Penalty'] = -15; }
    if (sleepHoursAvg > 8) { score += 5; breakdown['Restorative Sleep Bonus'] = +5; }

    score = Math.max(0, Math.min(100, score));

    let riskBand = "Low";
    if (score < 40) riskBand = "High";
    else if (score < 60) riskBand = "Moderate";

    return {
        mentalScore: Math.round(score),
        riskBand,
        breakdown
    };
}

// ── LIFESTYLE OPTIMIZER SCORING ──────────────────────────────────────────────
export function calculateLifestyleScore(answers: any) {
    let score = 50;
    const recommendations = [];

    if (answers.mealsPerDay && answers.mealsPerDay < 3) {
        score -= 10;
        recommendations.push("Stable Glucose: Aim for 3 structured meals to prevent insulin spikes and energy dips.");
    } else {
        score += 10;
    }

    if (answers.waterIntake && answers.waterIntake < 4) {
        score -= 15;
        recommendations.push("Cellular Hydration: Your current intake is critical. Aim for 2.5L+ to support renal function.");
    } else if (answers.waterIntake && answers.waterIntake >= 8) {
        score += 15;
    } else {
        recommendations.push("Hydration Optimization: Increase water by 2 glasses to reach the peak metabolic hydration zone.");
    }

    if (answers.exerciseMinutes && answers.exerciseMinutes < 30) {
        score -= 20;
        recommendations.push("Zone 2 Cardio: Try 30 mins of brisk walking to significantly lower all-cause mortality risk.");
    } else {
        score += 20;
        recommendations.push("Peak Performance: Your 30+ min routine is excellent for mitochondrial health.");
    }

    if (answers.sugarIntake === "high") {
        score -= 15;
        recommendations.push("Glycemic Load: High sugar detected. Swap simple carbs for complex grains to avoid metabolic fatigue.");
    }

    if (answers.vegIntake === "low") {
        score -= 10;
        recommendations.push("Micronutrient Gap: Increase leafy greens to ensure adequate magnesium and nitrate levels.");
    }

    score = Math.max(10, Math.min(100, score));
    return {
        score,
        tier: score >= 85 ? "Optimal" : score >= 60 ? "Balanced" : "High Risk",
        recommendations
    };
}

// ── FAMILY GENETIC RISK ──────────────────────────────────────────────
export function calculateGeneticRisk(familyTree: any[]) {
    const risks = {
        diabetes: 0,
        heartDisease: 0,
        cancer: 0,
        hypertension: 0
    };

    familyTree.forEach(member => {
        const weight = member.relation === "Parent" ? 30 : member.relation === "Grandparent" ? 15 : 10;
        member.conditions.forEach((cond: string) => {
            if (cond.toLowerCase().includes("diabetes")) risks.diabetes += weight;
            if (cond.toLowerCase().includes("heart")) risks.heartDisease += weight;
            if (cond.toLowerCase().includes("cancer")) risks.cancer += weight;
            if (cond.toLowerCase().includes("blood pressure") || cond.toLowerCase().includes("hypertension")) risks.hypertension += weight;
        });
    });

    return Object.keys(risks).map(condition => {
        let riskLvl = risks[condition as keyof typeof risks];
        riskLvl = Math.min(100, riskLvl);
        let tier = "Low";
        if (riskLvl >= 60) tier = "High";
        else if (riskLvl >= 30) tier = "Moderate";

        return { condition, riskPercentage: riskLvl, tier };
    }).filter(r => r.riskPercentage > 0);
}

// ── CLINICAL LAB VALUE INTERPRETATION ENGINE ─────────────────────────────────

export interface LabResult {
    testName: string;
    value: number;
    unit: string;
}

/**
 * Standardized reference ranges based loosely on consensus guidelines (e.g. ADA, AHA).
 * Helps ground AI interpretations into definitive, deterministic clinical facts.
 */
export function evaluateLabValues(results: LabResult[]) {
    const REFERENCE_RANGES: Record<string, { min: number, max: number, unit: string, interpretation: (val: number) => string }> = {
        "fasting blood sugar": {
            min: 70, max: 99, unit: "mg/dL",
            interpretation: (val) => val < 70 ? "Hypoglycemia (Low)" : val > 125 ? "Diabetes Range (High)" : val >= 100 ? "Prediabetes Range (Elevated)" : "Normal"
        },
        "hba1c": {
            min: 4.0, max: 5.6, unit: "%",
            interpretation: (val) => val < 4.0 ? "Low" : val >= 6.5 ? "Diabetes Range (High)" : val >= 5.7 ? "Prediabetes Range (Elevated)" : "Normal"
        },
        "ldl cholesterol": {
            min: 0, max: 99, unit: "mg/dL",
            interpretation: (val) => val < 100 ? "Optimal" : val < 130 ? "Near Optimal" : val < 160 ? "Borderline High" : "High"
        },
        "hdl cholesterol": {
            min: 40, max: 100, unit: "mg/dL",
            interpretation: (val) => val < 40 ? "Low (High Risk)" : val >= 60 ? "Optimal (Protective)" : "Normal"
        },
        "hemoglobin": {
            min: 12.0, max: 17.5, unit: "g/dL",
            interpretation: (val) => val < 12.0 ? "Low (Possible Anemia)" : val > 17.5 ? "High" : "Normal"
        },
        "heart rate": {
            min: 60, max: 100, unit: "bpm",
            interpretation: (val) => val < 60 ? "Bradycardia (Low)" : val > 100 ? "Tachycardia (High)" : "Normal"
        }
    };

    return results.map(result => {
        const refKey = result.testName.toLowerCase().trim();
        const ref = REFERENCE_RANGES[refKey] || Object.values(REFERENCE_RANGES).find(r => refKey.includes(r.unit)) || null;

        if (!ref && !REFERENCE_RANGES[refKey]) {
            return { ...result, referenceRange: "N/A", interpretation: "Unknown Test", isAnomalous: false };
        }

        const actualRef = REFERENCE_RANGES[refKey] || ref;

        const interpretation = actualRef.interpretation(result.value);
        const isAnomalous = interpretation.includes("High") || interpretation.includes("Low") || interpretation.includes("Elevated");

        return {
            ...result,
            referenceRange: `${actualRef.min} - ${actualRef.max} ${actualRef.unit}`,
            interpretation,
            isAnomalous
        };
    });
}

