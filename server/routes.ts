import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  healthAssistantChat,
  symptomCheck,
  predictHealth,
  translateText,
  generateHealthNews,
  mistralChat,
} from "./services/ai";
import {
  doctors,
  emergencyContacts,
} from "./data/staticData";
import { MEDICINES_DB, INSURANCE_DB } from "./data/extendedData";
import { registerAuthRoutes } from "./auth";
import { translateDeepJSON } from "./services/translationProxy";

import rateLimit from "express-rate-limit";

// In-memory stores (replace with DB in production)
const appointments: any[] = [];
const healthRecords: any[] = [];
const userProfiles: Map<string, any> = new Map();
const notifications: any[] = [];
let newsCache: { data: any[]; timestamp: number } | null = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Rate Limiter for AI Endpoints
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many AI requests from this IP, please try again after 15 minutes." }
});

// Application-wide Rate Limiter
const globalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { success: false, error: "Too many requests, please try again later." }
});

// Standardized API Response Helpers
const apiSuccess = (data: any, meta: any = {}) => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

const apiError = (message: string, details: any = null) => ({
  success: false,
  error: message,
  details,
  meta: {
    timestamp: new Date().toISOString()
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Auth & Profile Routes First
  registerAuthRoutes(app);

  // Apply global rate limit to all API routes
  app.use("/api/", globalRateLimit);

  // Apply stricter rate limiter to all AI routes
  app.use("/api/ai/", aiRateLimiter);
  app.use("/api/translate", aiRateLimiter);
  app.use("/api/advanced/", aiRateLimiter);

  // ─── Health Check ─────────────────────────────────────────
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json(apiSuccess({ status: "ok" }));
  });

  // ─── AI Status ─────────────────────────────────────────
  app.get("/api/ai/status", async (_req: Request, res: Response) => {
    try {
      const r = await fetch("http://localhost:11434/api/tags", {
        signal: AbortSignal.timeout(5000),
      });
      const data: any = await r.json();
      res.json({ available: true, models: data.models?.map((m: any) => m.name) || [] });
    } catch {
      res.json({ available: false, models: [] });
    }
  });

  // ─── AI: Health Assistant Chat ─────────────────────────────
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { message, history = [], imageUrl, userName = "User", userProfile } = req.body;
      if (!message && !imageUrl) return res.status(400).json({ error: "message or image required" });
      const reply = await healthAssistantChat(message, history, userName, userProfile, imageUrl);
      const notif = {
        id: generateId(),
        type: "ai_message",
        title: "New message from AI",
        message: reply.substring(0, 50) + "...",
        timestamp: new Date().toISOString(),
        read: false,
      };
      notifications.unshift(notif);

      res.json({ reply });
    } catch (err: any) {
      res.status(500).json({ error: "AI error", details: err.message });
    }
  });

  // ─── AI: Dynamic Translation Fallback ──────────────────────
  app.post("/api/ai/translate", async (req: Request, res: Response) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) return res.status(400).json({ error: "text and targetLanguage required" });

      const { translateTextStrict } = await import('./services/translationProxy');
      const translatedText = await translateTextStrict(text, targetLanguage);
      res.json({ translatedText });
    } catch (err: any) {
      res.status(500).json({ error: "Translation failed", details: err.message });
    }
  });

  // ─── AI: Symptom Checker ───────────────────────────────────
  app.post("/api/ai/symptom-check", async (req: Request, res: Response) => {
    try {
      const { symptoms, imageDescription, userProfile } = req.body;
      if (!symptoms) return res.status(400).json({ error: "symptoms required" });
      const result = await symptomCheck(symptoms, imageDescription || null, userProfile);
      res.json(result);
    } catch (err: any) {
      res.status(503).json({ error: err.message || "AI service unavailable" });
    }
  });

  // ─── AI: Health Predictions ────────────────────────────────
  app.post("/api/ai/predict", async (req: Request, res: Response) => {
    try {
      const { profile } = req.body;
      if (!profile) return res.status(400).json({ error: "profile required" });
      const result = await predictHealth(profile);

      // Create alert notification if high risk
      if (result.diabetesRisk > 70 || result.heartRisk > 70 || result.bpRisk > 70) {
        notifications.unshift({
          id: generateId(),
          type: "alert",
          title: "Health Alert",
          message: "High risk detected in your health prediction. Please consult a doctor.",
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
      res.json(result);
    } catch (err: any) {
      res.status(503).json({ error: err.message || "AI service unavailable" });
    }
  });

  // ─── AI: Translation ───────────────────────────────────────
  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      const { text, targetLanguage, context } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: "text and targetLanguage required" });
      }
      if (targetLanguage === "en" || targetLanguage === "English") {
        return res.json({ translated: text });
      }
      const translated = await translateText(text, targetLanguage, context);
      res.json({ translated });
    } catch (err: any) {
      res.status(503).json({ error: err.message || "Translation service unavailable" });
    }
  });

  // ─── AI: Batch Translation ─────────────────────────────────
  app.post("/api/translate/batch", async (req: Request, res: Response) => {
    try {
      const { texts, targetLanguage, context } = req.body;
      if (!texts || !Array.isArray(texts) || !targetLanguage) {
        return res.status(400).json({ error: "texts array and targetLanguage required" });
      }
      if (targetLanguage === "en" || targetLanguage === "English") {
        return res.json({ translations: texts });
      }
      const translations = await Promise.all(
        texts.map((t: string) => translateText(t, targetLanguage, context))
      );
      res.json({ translations });
    } catch (err: any) {
      res.status(503).json({ error: err.message || "Translation service unavailable" });
    }
  });

  // ─── AI Features ──────────────────────────────────────────
  // Duplicate AI routes removed (original ones are at the beginning of registerRoutes)

  // ─── Health News ───────────────────────────────────────────
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      let articles;
      if (newsCache && Date.now() - newsCache.timestamp < 3600000) {
        articles = newsCache.data;
      } else {
        articles = await generateHealthNews();
        newsCache = { data: articles, timestamp: Date.now() };
      }
      res.json(apiSuccess(articles));
    } catch (err: any) {
      console.error("Failed fetching news via Mistral:", err);
      res.status(500).json(apiError("Failed to fetch health news"));
    }
  });

  // --- DATA SYNCHRONIZATION AND TIMELINE ───

  app.get("/api/user/profile/:id", async (req: Request, res: Response) => {
    try {
      const profile = await storage.getHealthProfile(req.params.id as string);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/user/profile/:id/sync", async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateHealthProfile(req.params.id as string, req.body);

      // Auto-run score recalculation on save (Cron job simulation)
      const { calculateHealthCreditScore } = await import('./services/analytics');
      const scoreData = calculateHealthCreditScore({
        age: Number(updated.age) || 30, bmi: Number(updated.bmi) || 24
      });

      await storage.updateHealthProfile(req.params.id as string, {
        healthScore: scoreData.score.toString()
      });

      // Add to timeline
      await storage.createTimelineEvent({
        userId: req.params.id as string,
        type: "ScoreUpdate",
        title: "Health Metrics Re-evaluated",
        timestamp: new Date().toISOString()
      });

      res.json(await storage.getHealthProfile(req.params.id as string));
    } catch (err) {
      res.status(500).json({ error: "Profile sync failed" });
    }
  });

  app.get("/api/user/timeline/:id", async (req: Request, res: Response) => {
    try {
      const events = await storage.getTimelineEvents(req.params.id as string);
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch timeline" });
    }
  });

  // ─── ADVANCED MODE ANALYTICS ENDPOINTS ─────────────────────

  app.post("/api/advanced/credit-score", async (req: Request, res: Response) => {
    try {
      const { calculateHealthCreditScore } = await import('./services/analytics');
      const { mistralChat } = await import('./services/ai');
      const profile = req.body.profile;

      if (!profile || !profile.age || !profile.bmi || !profile.bloodPressure) {
        return res.status(400).json({ error: "Insufficient Data: Age, BMI, and Blood Pressure are required for a deterministic calculation." });
      }

      const result = calculateHealthCreditScore(profile);

      const prompt = `Based on the user's health profile (BMI: ${profile.bmi}, BP: ${profile.bloodPressure}), their deterministic Health Credit Score is ${result.score}/1000. Give a 2-sentence empathetic explanation and actionable prediction for their future health. Do not include markdown formatting.`;

      // 4-second hard timeout for AI explanations to ensure snappy UI
      try {
        const aiPromise = mistralChat([{ role: "user", content: prompt }], "mistral-small-latest");
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 4000));
        const aiExp = await Promise.race([aiPromise, timeoutPromise]) as string;
        result.explanation = aiExp;
      } catch (e) {
        // Fallback explanation already generated by deterministic engine
        console.warn("Mistral slow/failed, using deterministic fallback for credit score.");
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Score calculation failed", details: err.message });
    }
  });

  app.post("/api/advanced/radar", async (req: Request, res: Response) => {
    try {
      const { calculateDiseaseRisks } = await import('./services/analytics');
      const { mistralChat } = await import('./services/ai');
      const profile = req.body.profile;

      if (!profile || !profile.age || !profile.bmi) {
        return res.status(400).json({ error: "Insufficient Data: Age and BMI are required for predictive disease modeling." });
      }

      const result = calculateDiseaseRisks(profile);

      const prompt = `Based on the user's health profile (Age: ${profile.age}, BMI: ${profile.bmi}, BP: ${profile.bloodPressure}), their deterministic Cardiovascular Risk is ${result.cardiovascularPercentage}% and Type 2 Diabetes Risk is ${result.type2DiabetesPercentage}%. Status is ${result.status}. 
Provide a 2-sentence clinical explanation of why these specific risks exist for them, and a short prediction. No markdown highlighting.`;

      let aiExplanation = "Based on clinical algorithms tracking your BMI, age, and systemic factors, typical trajectory risks were determined. Maintain optimal parameters to lower risks.";
      try {
        const aiPromise = mistralChat([{ role: "user", content: prompt }], "mistral-small-latest");
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 4000));
        aiExplanation = await Promise.race([aiPromise, timeoutPromise]) as string;
      } catch (e) {
        console.warn("Mistral slow/failed, using deterministic fallback for radar.");
      }

      res.json({ ...result, aiExplanation });
    } catch (err: any) {
      res.status(500).json({ error: "Radar calculation failed", details: err.message });
    }
  });

  app.post("/api/advanced/medicine/risk", async (req: Request, res: Response) => {
    try {
      const { checkMedicineRisk } = await import('./services/medicineIntl');
      const { medicineName, profile } = req.body;
      const result = await checkMedicineRisk(medicineName, profile);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Med risk check failed", details: err.message });
    }
  });

  app.post("/api/advanced/outbreaks", async (req: Request, res: Response) => {
    try {
      const { getLocalOutbreaks } = await import('./services/contextEngine');
      const { mistralChat } = await import('./services/ai');
      const location = req.body.location || "unknown";
      const alerts = getLocalOutbreaks(location);

      // Supercharge with AI for more premium advice
      const aiAlerts = await Promise.all(alerts.map(async (alert) => {
        try {
          const prompt = `Location: ${location}. Disease: ${alert.disease}. Risk: ${alert.riskLevel}. 
          Provide a single, state-of-the-art preventive recommendation in 10-12 words max. No markdown.`;
          const advice = await mistralChat([{ role: "user", content: prompt }], "mistral-small-latest");
          return { ...alert, recommendation: advice.replace(/"/g, "") };
        } catch (e) {
          return alert; // Fallback to deterministic
        }
      }));

      // Trigger notif if high risk
      if (aiAlerts.some(a => a.riskLevel === "CRITICAL" || a.riskLevel === "HIGH")) {
        notifications.unshift({
          id: generateId(), type: "alert", title: "Outbreak Warning",
          message: aiAlerts[0].recommendation, timestamp: new Date().toISOString(), read: false
        });
      }
      res.json({ alerts: aiAlerts });
    } catch (err: any) {
      res.status(500).json({ error: "Outbreak check failed" });
    }
  });

  app.get("/api/advanced/insurance", async (req: Request, res: Response) => {
    try {
      const { getInsuranceSchemes } = await import('./services/contextEngine');
      res.json({ schemes: getInsuranceSchemes() });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch insurance schemes" });
    }
  });

  app.post("/api/advanced/mental", async (req: Request, res: Response) => {
    try {
      const { calculateMentalHealthScore } = await import('./services/analytics');
      const { moodLogs, sleepHours } = req.body;
      const result = calculateMentalHealthScore(moodLogs || [], sleepHours || 7);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Mental score calculation failed", details: err.message });
    }
  });

  app.post("/api/advanced/lifestyle", async (req: Request, res: Response) => {
    try {
      const { calculateLifestyleScore } = await import('./services/analytics');
      const result = calculateLifestyleScore(req.body.answers || {});
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Lifestyle score calculation failed", details: err.message });
    }
  });

  app.post("/api/advanced/family", async (req: Request, res: Response) => {
    try {
      const { calculateGeneticRisk } = await import('./services/analytics');
      const { mistralChat } = await import('./services/ai');
      const tree = req.body.tree || [];
      const risks = calculateGeneticRisk(tree);

      // Generate AI Roadmap
      let roadmap = "Add more family members to generate a personalized genetic roadmap.";
      if (risks.length > 0) {
        try {
          const prompt = `Based on family health history risks: ${JSON.stringify(risks)}. 
          Provide a 2-sentence proactive genetic roadmap for the user. 
          Also provide 2 short bullet points for 'Next Step' and 'Primary Recommendation'. Format: Roadmap|Next Step|Recommendation.`;
          const aiRes = await mistralChat([{ role: "user", content: prompt }], "mistral-small-latest");
          roadmap = aiRes;
        } catch (e) {
          roadmap = "Clinical risk detected. Maintain regular screenings and dietary vigilance.|Regular Screenings|Dietary Audit";
        }
      }

      const [msg, next, rec] = roadmap.includes("|") ? roadmap.split("|") : [roadmap, "Regular Screenings", "Dietary Audit"];
      res.json({ risks, roadmap: msg.trim(), nextStep: next.trim(), recommendation: rec.trim() });
    } catch (err: any) {
      res.status(500).json({ error: "Genetic risk calculation failed", details: err.message });
    }
  });

  // ─── DYNAMIC AI QUIZ ENGINE ────────────────────────────────

  app.post("/api/advanced/quiz/generate", async (req: Request, res: Response) => {
    try {
      const { domain, userId } = req.body;
      const { generateQuiz } = await import('./services/quizEngine');

      const profile = await storage.getHealthProfile(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const memory = JSON.parse(profile.quizMemory || "{}");
      const history = memory[domain] || [];

      const quiz = await generateQuiz(domain, profile, history);
      res.json(quiz);
    } catch (err: any) {
      res.status(500).json({ error: "Quiz generation failed", details: err.message });
    }
  });

  app.post("/api/advanced/quiz/submit", async (req: Request, res: Response) => {
    try {
      const { domain, userId, answers } = req.body;
      const profile = await storage.getHealthProfile(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      // Update quiz memory to avoid repetition
      const memory = JSON.parse(profile.quizMemory || "{}");
      if (!memory[domain]) memory[domain] = [];

      const newQuestionIds = Object.keys(answers);
      memory[domain] = Array.from(new Set([...memory[domain], ...newQuestionIds]));

      await storage.updateHealthProfile(userId, { quizMemory: JSON.stringify(memory) });

      // Dynamic Scoring Logic based on domain
      let scoreUpdate: any = {};
      const avgScore = Object.values(answers).reduce((a: any, b: any) => a + b, 0) as number / Object.values(answers).length;

      if (domain === 'lifestyle') scoreUpdate.lifestyleScore = Math.round(avgScore).toString();
      if (domain === 'mental') scoreUpdate.mentalScore = Math.round(avgScore).toString();
      if (domain === 'body_scan' || domain === 'heart' || domain === 'diabetes') {
        // If it's a scan, we update risks
        const risk = 100 - avgScore; // higher score = lower risk
        if (domain === 'heart' || domain === 'body_scan') scoreUpdate.cardiacRisk = Math.round(risk).toString();
        if (domain === 'diabetes' || domain === 'body_scan') scoreUpdate.diabetesRisk = Math.round(risk).toString();
      }

      const updated = await storage.updateHealthProfile(userId, scoreUpdate);

      // AI Insight for the result
      const prompt = `Based on the user's ${domain} assessment (Score: ${Math.round(avgScore)}/100), give a 2-sentence professional insight. Domain: ${domain}. No markdown.`;
      let insight = "Assessment complete. Your metrics have been updated for clinic-grade monitoring.";
      try {
        const aiRes = await mistralChat([{ role: "user", content: prompt }], "mistral-small-latest");
        insight = aiRes;
      } catch (e) { }

      res.json({ success: true, profile: updated, insight });
    } catch (err: any) {
      res.status(500).json({ error: "Quiz submission failed", details: err.message });
    }
  });

  // ─── Doctors ───────────────────────────────────────────────
  app.get("/api/doctors", async (req: Request, res: Response) => {
    const { specialty, search } = req.query;
    let filtered = [...doctors];
    if (specialty) {
      filtered = filtered.filter((d) =>
        d.specialty.toLowerCase().includes((specialty as string).toLowerCase())
      );
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.hospital.toLowerCase().includes(q)
      );
    }
    const translated = await translateDeepJSON(filtered, req.query.lang as string || 'en');
    res.json(apiSuccess(translated));
  });

  app.get("/api/doctors/:id", async (req: Request, res: Response) => {
    const doc = doctors.find((d) => d.id === parseInt(req.params.id as string));
    if (!doc) return res.status(404).json(apiError("Doctor not found"));
    const translated = await translateDeepJSON(doc, req.query.lang as string || 'en');
    res.json(apiSuccess(translated));
  });

  // ─── Appointments ──────────────────────────────────────────
  app.get("/api/appointments", (req: Request, res: Response) => {
    const { userId } = req.query;
    const filtered = userId
      ? appointments.filter((a) => a.userId === userId)
      : appointments;
    res.json(apiSuccess(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));
  });

  app.post("/api/appointments", (req: Request, res: Response) => {
    const { doctorId, slot, userId, reason, userName } = req.body;
    if (!doctorId || !slot) {
      return res.status(400).json({ error: "doctorId and slot required" });
    }
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    const appointment = {
      id: generateId(),
      doctorId,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorImage: doctor.image,
      doctorFee: doctor.fee,
      slot,
      userId: userId || "guest",
      userName: userName || "User",
      reason: reason || "General consultation",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    appointments.unshift(appointment);

    notifications.unshift({
      id: generateId(),
      type: "appointment",
      title: "Appointment Confirmed",
      message: `Your appointment with ${doctor.name} is confirmed for ${new Date(slot).toLocaleDateString()}`,
      timestamp: new Date().toISOString(),
      read: false,
      link: "/consult",
    });

    res.status(201).json(apiSuccess(appointment));
  });

  app.put("/api/appointments/:id", (req: Request, res: Response) => {
    const idx = appointments.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Appointment not found" });
    appointments[idx] = { ...appointments[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json(appointments[idx]);
  });

  app.delete("/api/appointments/:id", (req: Request, res: Response) => {
    const idx = appointments.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Appointment not found" });
    const [removed] = appointments.splice(idx, 1);
    notifications.unshift({
      id: generateId(),
      type: "info",
      title: "Appointment Cancelled",
      message: `Appointment with ${removed.doctorName} has been cancelled`,
      timestamp: new Date().toISOString(),
      read: false,
    });
    res.json({ success: true });
  });

  // ─── Health Records ────────────────────────────────────────
  app.get("/api/records", (req: Request, res: Response) => {
    const { userId, category } = req.query;
    let filtered = userId
      ? healthRecords.filter((r) => r.userId === userId)
      : healthRecords;
    if (category) {
      filtered = filtered.filter((r) => r.category === category);
    }
    const typeQuery = (req.query.type as string);
    if (typeQuery && typeQuery !== "All") {
      filtered = filtered.filter(s => s.type === typeQuery);
    }
    res.json(apiSuccess(filtered.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())));
  });

  app.post("/api/records", (req: Request, res: Response) => {
    const { title, category, doctor, size, fileType, userId, dataUrl } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: "title and category required" });
    }
    const record = {
      id: generateId(),
      title,
      category,
      doctor: doctor || "Self Upload",
      size: size || "Unknown",
      fileType: fileType || "document",
      userId: userId || "guest",
      dataUrl: dataUrl || null,
      uploadedAt: new Date().toISOString(),
    };
    healthRecords.unshift(record);

    notifications.unshift({
      id: generateId(),
      type: "record",
      title: "Record Uploaded",
      message: `${title} has been added to your health records`,
      timestamp: new Date().toISOString(),
      read: false,
      link: "/records",
    });

    res.status(201).json(record);
  });

  app.delete("/api/records/:id", (req: Request, res: Response) => {
    const idx = healthRecords.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Record not found" });
    healthRecords.splice(idx, 1);
    res.json({ success: true });
  });

  // ─── Medicines ─────────────────────────────────────────────
  app.get("/api/medicines", async (req: Request, res: Response) => {
    const { search, category, lang = 'en' } = req.query;
    let filtered = [...MEDICINES_DB];
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.generic.toLowerCase().includes(q)
      );
    }
    if (category) {
      filtered = filtered.filter((m) =>
        m.type.toLowerCase().includes((category as string).toLowerCase())
      );
    }

    // AI Fallback if no local matches
    if (search && filtered.length === 0) {
      try {
        const prompt = `Provide clinical information for the medicine: "${search}". 
        Include: name, dose, type, cost (in INR), generic name.
        Respond ONLY with a JSON array: [{"name": "string", "dose": "string", "type": "string", "cost": "string", "generic": "string"}].`;

        const response = await mistralChat([
          { role: "system", content: "You are a medical pharmacy AI. Respond only with JSON array." },
          { role: "user", content: prompt }
        ], "mistral-small-latest", "json");

        const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
        filtered = JSON.parse(cleaned);
      } catch (err) {
        filtered = [];
      }
    }

    const translated = await translateDeepJSON(filtered, lang as string);
    res.json(translated);
  });

  app.get("/api/medicines/:id", async (req: Request, res: Response) => {
    // Since IDs aren't in MEDICINES_DB, we use index as ID or search by name if provided as string
    const id = req.params.id as string;
    const med = MEDICINES_DB.find((m: any, idx: number) => idx === parseInt(id) || m.name.toLowerCase() === id.toLowerCase());
    if (!med) return res.status(404).json({ error: "Medicine not found" });
    const translated = await translateDeepJSON(med, req.query.lang as string || 'en');
    res.json(translated);
  });

  // ─── Insurance ─────────────────────────────────────────────
  app.get("/api/insurance", async (req: Request, res: Response) => {
    const { type, search, lang = 'en' } = req.query;
    let filtered = [...INSURANCE_DB];
    if (type && type !== "All") {
      const t = (type as string).toLowerCase();
      filtered = filtered.filter((s: any) =>
        s.type.toLowerCase().includes(t) ||
        (t === 'government' && s.type.toLowerCase().includes('govt'))
      );
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter((s: any) =>
        s.name.toLowerCase().includes(q) ||
        s.benefit.toLowerCase().includes(q)
      );
    }

    // AI Fallback if no local matches
    if (search && filtered.length === 0) {
      try {
        const prompt = `Find health insurance schemes (Government of India or Private) related to: "${search}". 
        Respond ONLY with a JSON array: [{"id": "slug", "name": "string", "type": "Government|Private", "eligibility": ["string"], "benefit": "string", "coverage": "string", "premium": "string", "rating": 4.5}].`;

        const response = await mistralChat([
          { role: "system", content: "You are an insurance expert AI. Respond only with JSON array." },
          { role: "user", content: prompt }
        ], "mistral-small-latest", "json");

        const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
        filtered = JSON.parse(cleaned);
      } catch (err) {
        filtered = [];
      }
    }

    const translated = await translateDeepJSON(filtered, lang as string);
    res.json(translated);
  });

  app.get("/api/insurance/:id", async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const scheme = INSURANCE_DB.find((s: any) => s.id === id || s.name.toLowerCase() === id.toLowerCase());
    if (!scheme) return res.status(404).json({ error: "Insurance scheme not found" });
    const translated = await translateDeepJSON(scheme, req.query.lang as string || 'en');
    res.json(translated);
  });

  // ─── Hospital Locator (Nominatim) ──────────────────────────
  app.get("/api/hospitals/nearby", async (req: Request, res: Response) => {
    try {
      const { lat, lon, radius = 10000 } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: "lat and lon required" });
      }
      const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=hospital](around:${radius},${lat},${lon});out;`;
      const response = await fetch(url, {
        headers: { "User-Agent": "Healthify/1.0 (health app)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Overpass API failed");
      const data: any = await response.json();
      const hospitals = data.elements?.map((el: any) => ({
        id: el.id,
        name: el.tags?.name || "Hospital",
        lat: el.lat,
        lon: el.lon,
        phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
        website: el.tags?.website || null,
        address: el.tags?.["addr:full"] || el.tags?.["addr:street"] || "Nearby",
        distance: calculateDistance(parseFloat(lat as string), parseFloat(lon as string), el.lat, el.lon),
      })).sort((a: any, b: any) => a.distance - b.distance).slice(0, 10) || [];

      res.json(hospitals);
    } catch (err: any) {
      // Fallback mock data
      res.json([
        { id: 1, name: "District Government Hospital", lat: 0, lon: 0, phone: "108", address: "Nearby - Call 108 for ambulance", distance: 0.5 },
        { id: 2, name: "Primary Health Centre", lat: 0, lon: 0, phone: "104", address: "Nearby - Call 104 for health info", distance: 1.2 },
      ]);
    }
  });

  // ─── Emergency Contacts ────────────────────────────────────
  app.get("/api/emergency-contacts", (_req: Request, res: Response) => {
    res.json(emergencyContacts);
  });

  // ─── Notifications ─────────────────────────────────────────
  app.get("/api/notifications", (req: Request, res: Response) => {
    const { userId } = req.query;
    res.json(notifications.slice(0, 50));
  });

  app.put("/api/notifications/:id/read", (req: Request, res: Response) => {
    const notif = notifications.find((n) => n.id === req.params.id);
    if (notif) notif.read = true;
    res.json({ success: true });
  });

  app.put("/api/notifications/read-all", (_req: Request, res: Response) => {
    notifications.forEach((n) => (n.read = true));
    res.json({ success: true });
  });

  // ─── User Profile ──────────────────────────────────────────
  app.get("/api/user/profile/:userId", (req: Request, res: Response) => {
    const profile = userProfiles.get(req.params.userId as string);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  });

  app.put("/api/user/profile/:userId", (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const existing = userProfiles.get(userId) || {};
    const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
    userProfiles.set(userId, updated);
    res.json(updated);
  });

  app.post("/api/user/profile", (req: Request, res: Response) => {
    const userId = generateId();
    const profile = { ...req.body, userId, createdAt: new Date().toISOString() };
    userProfiles.set(userId, profile);
    res.status(201).json(profile);
  });

  // ─── Health Tips (quick daily tips) ───────────────────────
  app.get("/api/health-tips", async (_req: Request, res: Response) => {
    const tips = [
      "Drink at least 8 glasses of water daily to stay hydrated. 💧",
      "Walk 10,000 steps a day to improve cardiovascular health. 🚶",
      "Eat more fruits and vegetables — aim for 5 portions daily. 🥦",
      "Get 7-8 hours of sleep for optimal health and immunity. 😴",
      "Practice deep breathing for 5 minutes to reduce stress. 🧘",
      "Wash hands frequently to prevent infections and illness. 🙌",
      "Check your blood pressure regularly if you're over 40. ❤️",
      "Limit sugar intake to reduce risk of diabetes. 🍬",
      "Take a 5-minute break every hour if you sit at work. ⏰",
      "Annual health checkups can catch diseases early. 🏥",
    ];
    const today = new Date().getDate();
    res.json({ tip: tips[today % tips.length] });
  });

  return httpServer;
}

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
