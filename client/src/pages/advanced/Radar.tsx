import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldAlert, Heart, Info, ArrowLeft, ArrowRight, CheckCircle2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface RadarResult {
    cardiovascularPercentage: number;
    type2DiabetesPercentage: number;
    status: "CLEAR" | "WARNING" | "CRITICAL";
    aiExplanation?: string;
}

export default function Radar() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [step, setStep] = useState(0); // 0: Intro, 1-N: Questions, 10: Loading, 11: Result
    const [quiz, setQuiz] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<RadarResult | null>(null);
    const [loading, setLoading] = useState(false);

    const startScan = async () => {
        setLoading(true);
        setStep(10);
        try {
            const res = await fetch("/api/advanced/quiz/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: "body_scan", userId: user.userId })
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setQuiz(data);
            setStep(1);
        } catch (err) {
            console.error("Failed to generate quiz:", err);
            // Fallback to avoid complete failure
            setStep(0);
            alert("Unable to start scan. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (qId: string, val: number) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
        setTimeout(() => {
            if (quiz && step < quiz.questions.length) {
                setStep(s => s + 1);
            } else {
                submitScan({ ...answers, [qId]: val });
            }
        }, 300);
    };

    const submitScan = async (finalAnswers: Record<string, number>) => {
        setLoading(true);
        setStep(10);
        try {
            const res = await fetch("/api/advanced/quiz/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain: "body_scan",
                    userId: user.userId,
                    answers: finalAnswers
                })
            });
            const data = await res.json();

            // Map the profile risks to the RadarResult interface
            const profile = data.profile;
            setResult({
                cardiovascularPercentage: parseInt(profile.cardiacRisk || "15"),
                type2DiabetesPercentage: parseInt(profile.diabetesRisk || "20"),
                status: (parseInt(profile.cardiacRisk || "0") > 70 || parseInt(profile.diabetesRisk || "0") > 70) ? "CRITICAL" :
                    (parseInt(profile.cardiacRisk || "0") > 40 || parseInt(profile.diabetesRisk || "0") > 40) ? "WARNING" : "CLEAR",
                aiExplanation: data.insight
            });
            setStep(11);
        } catch (err) {
            console.error("Failed to submit scan:", err);
            setStep(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout>
            <div className="absolute inset-0 bg-slate-50 z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-100/60 blur-[100px] rounded-full mix-blend-multiply" />
            </div>

            <div className="mb-8 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <a className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </a>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight text-slate-800 flex items-center gap-2">
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">{t("Body Scan")}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                            {t("Body Scan")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] min-h-[480px] flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {/* Intro */}
                    {step === 0 && (
                        <motion.div
                            key="intro" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex flex-col items-center justify-center text-center p-4"
                        >
                            <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-8 shadow-sm">
                                <Activity className="w-12 h-12 animate-pulse" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-3">{t("Initialize Body Scan")}</h2>
                            <p className="text-xs text-slate-500 mb-10 max-w-[280px] leading-relaxed font-medium">
                                {t("Conduct an interactive biometric assessment to detect silent cardiovascular and metabolic markers.")}
                            </p>
                            <button
                                onClick={startScan}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-[20px] font-bold uppercase tracking-widest text-sm shadow-lg flex items-center justify-center gap-3"
                            >
                                {t("Start Scan")} <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {/* Quiz Questions */}
                    {quiz && step >= 1 && step <= quiz.questions.length && (
                        <motion.div
                            key={`q${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <div className="mb-8 flex items-center gap-4">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(step / quiz.questions.length) * 100}%` }} />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4">
                                {t("Scanning Parameter")} {step} {t("of")} {quiz.questions.length}
                            </p>
                            <h3 className="text-xl font-bold text-slate-800 leading-relaxed mb-8">
                                {quiz.questions[step - 1].title}
                            </h3>
                            <div className="space-y-3">
                                {quiz.questions[step - 1].options.map((opt: any, i: number) => {
                                    const isSelected = answers[quiz.questions[step - 1].id] === opt.value;
                                    return (
                                        <button
                                            key={i} onClick={() => handleAnswer(quiz.questions[step - 1].id, opt.value)}
                                            className={cn(
                                                "w-full p-5 rounded-[20px] border text-left font-medium transition-all flex items-center justify-between",
                                                isSelected ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-600"
                                            )}
                                        >
                                            {t(opt.label)}
                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Loading */}
                    {step === 10 && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 border-[3px] border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-6 flex items-center justify-center">
                                <Activity className="w-6 h-6 animate-pulse text-emerald-500" />
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase animate-pulse">{t("Coalescing Biometrics...")}</p>
                        </motion.div>
                    )}

                    {/* Results */}
                    {step === 11 && result && (
                        <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <div className={cn(
                                "p-5 rounded-[24px] flex items-center gap-4 border mb-6",
                                result.status === "CLEAR" ? "border-emerald-100 bg-emerald-50/50" : "border-amber-100 bg-amber-50/50"
                            )}>
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", result.status === "CLEAR" ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-amber-100 text-amber-600 border-amber-200")}>
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className={cn("font-bold text-sm tracking-wider uppercase", result.status === "CLEAR" ? "text-emerald-700" : "text-amber-700")}>
                                        {t(result.status === "CLEAR" ? "No Critical Threats" : "Threat Detected")}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{t("Clinical Trajectory Deciphered")}</p>
                                </div>
                            </div>

                            <RiskCard title={t("Heart Health Risk (10-Yr)")} percentage={result.cardiovascularPercentage} icon={Heart} color="amber" description={t("Probability of cardiovascular issues within 10 years.")} />
                            <div className="h-4" />
                            <RiskCard title={t("Sugar Levels Risk")} percentage={result.type2DiabetesPercentage} icon={Activity} color="emerald" description={t("Risk of developing metabolic syndrome.")} />

                            <div className="mt-8 bg-slate-900 rounded-[24px] p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />
                                <h4 className="font-bold text-emerald-400 text-[10px] tracking-widest uppercase mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    {t("AI Insight")}
                                </h4>
                                <p className="text-[13px] text-slate-100 leading-relaxed font-medium mb-6 relative z-10">
                                    {t(result.aiExplanation || "Maintenance of current biometrics is advised.")}
                                </p>
                                <button onClick={() => setStep(0)} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                    <RefreshCcw className="w-3.3 h-3.3" /> {t("Re-scan Body")}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
}

function RiskCard({ title, percentage, icon: Icon, color, description }: any) {
    const { t } = useStrictTranslation();
    const colorMap = {
        emerald: { bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100", bar: "bg-emerald-500", track: "bg-emerald-100" },
        amber: { bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100", bar: "bg-amber-500", track: "bg-amber-100" },
    };
    const colorStyles = colorMap[color as keyof typeof colorMap] || colorMap.emerald;

    return (
        <div className={cn("rounded-[24px] p-6 border relative overflow-hidden bg-white/50", colorStyles.border)}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm bg-white", colorStyles.border)}>
                        <Icon className={cn("w-5 h-5", colorStyles.text)} />
                    </div>
                    <h4 className="font-bold text-slate-800 tracking-wide text-xs uppercase">{title}</h4>
                </div>
                <p className={cn("text-2xl font-black tracking-tight", colorStyles.text)}>{percentage}%</p>
            </div>
            <div className={cn("w-full h-2 rounded-full mb-4 overflow-hidden", colorStyles.track)}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(percentage, 100)}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full", colorStyles.bar)} />
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{description}</p>
        </div>
    );
}
