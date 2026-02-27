import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ArrowRight, ArrowLeft, RefreshCcw, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Mental() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [step, setStep] = useState(0); // 0: Intro, 1-N: Questions, 7: Sleep, 10: Loading, 11: Result
    const [quiz, setQuiz] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [sleepHours, setSleepHours] = useState<number | null>(null);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const startQuiz = async () => {
        setLoading(true);
        setStep(10);
        try {
            const res = await fetch("/api/advanced/quiz/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: "mental_health", userId: user.userId })
            });
            const data = await res.json();
            setQuiz(data);
            setStep(1);
        } catch (err) {
            console.error("Failed to generate quiz:", err);
            setStep(0);
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
                setStep(7); // Go to Sleep Hours
            }
        }, 300);
    };

    const submitQuiz = async () => {
        if (!sleepHours) return;
        setLoading(true);
        setStep(10);
        try {
            const res = await fetch("/api/advanced/quiz/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain: "mental_health",
                    userId: user.userId,
                    answers: answers,
                    metadata: { sleepHours }
                })
            });
            const data = await res.json();
            setResult({
                score: data.profile.mentalScore,
                riskBand: parseInt(data.profile.mentalScore) > 75 ? "Excellent" :
                    parseInt(data.profile.mentalScore) > 45 ? "Moderate" : "High",
                insight: data.insight
            });
            setStep(11);
        } catch (err) {
            console.error("Failed to submit quiz:", err);
            setStep(0);
        } finally {
            setLoading(false);
        }
    };

    const resetQuiz = () => {
        setAnswers({});
        setSleepHours(null);
        setResult(null);
        setStep(0);
    };

    return (
        <MobileLayout>
            <div className="absolute inset-0 bg-slate-50 z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-100/60 blur-[100px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-fuchsia-100/60 blur-[100px] rounded-full mix-blend-multiply" />
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
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">{t("Mindscape")}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                            {t("Cognitive Serenity")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] min-h-[480px] flex flex-col relative overflow-hidden">
                <AnimatePresence mode="wait">

                    {/* Intro Step */}
                    {step === 0 && (
                        <motion.div
                            key="intro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col items-center justify-center text-center inset-0 absolute p-6"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50 mix-blend-overlay" />
                            <div className="w-24 h-24 rounded-full bg-purple-50 text-purple-600 border border-purple-100 shadow-sm flex items-center justify-center mb-8 relative z-10">
                                <Brain className="w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-wide relative z-10">{t("Mind Scan")}</h2>
                            <p className="text-xs text-slate-500 mb-10 max-w-[250px] mx-auto leading-relaxed relative z-10 font-medium">
                                {t("Conduct an interactive psychological assessment to generate a deterministic cognitive score.")}
                            </p>
                            <button
                                onClick={startQuiz}
                                className="w-full max-w-[200px] py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-[20px] font-bold uppercase tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-3 relative z-10"
                            >
                                {t("Begin Scan")} <ArrowRight className="w-5 h-5 text-purple-50" />
                            </button>
                        </motion.div>
                    )}

                    {/* Question Steps */}
                    {quiz && step >= 1 && step <= quiz.questions.length && (
                        <motion.div
                            key={`q${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col w-full h-full inset-0 absolute p-6"
                        >
                            <div className="mb-8 flex items-center gap-4">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 shadow-sm transition-all duration-500 ease-out" style={{ width: `${(step / (quiz.questions.length + 1)) * 100}%` }} />
                                </div>
                            </div>

                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-4">
                                {t("Parameter")} {step} {t("of")} {quiz.questions.length}
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
                                                "w-full p-5 rounded-[20px] border text-left font-medium transition-all duration-300 flex items-center justify-between shadow-sm",
                                                isSelected
                                                    ? "bg-purple-50 border-purple-300 text-purple-900"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-800"
                                            )}
                                        >
                                            {t(opt.label)}
                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Sleep Hours Step */}
                    {step === 7 && (
                        <motion.div
                            key="sleep" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col w-full h-full inset-0 absolute p-6"
                        >
                            <div className="mb-8 flex items-center gap-4">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 shadow-sm transition-all duration-500 ease-out" style={{ width: `100%` }} />
                                </div>
                            </div>

                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-4">
                                {t("Final Step")}
                            </p>
                            <h3 className="text-xl font-bold text-slate-800 leading-relaxed mb-8">
                                {t("Average hours of sleep per night?")}
                            </h3>

                            <div className="space-y-6">
                                <input
                                    type="number"
                                    min={0} max={24}
                                    placeholder="e.g. 7"
                                    value={sleepHours || ""}
                                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                                    className="w-full text-center text-[40px] font-black p-4 border-b-2 border-slate-100 focus:outline-none focus:border-purple-400 bg-transparent text-slate-800 placeholder-slate-200 transition-colors"
                                />
                                <button
                                    onClick={submitQuiz}
                                    disabled={!sleepHours}
                                    className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:grayscale text-white rounded-[20px] font-bold uppercase tracking-widest transition-all shadow-lg"
                                >
                                    {t("Analyze Results")}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Loading Step */}
                    {step === 10 && (
                        <motion.div
                            key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center inset-0 absolute p-6"
                        >
                            <div className="w-16 h-16 border-[3px] border-purple-100 border-t-purple-500 rounded-full animate-spin mb-6 text-purple-500 shadow-sm flex items-center justify-center">
                                <Brain className="w-6 h-6 animate-pulse text-purple-500" />
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase animate-pulse">{t("Coalescing Cognition Data...")}</p>
                        </motion.div>
                    )}

                    {/* Results Step */}
                    {step === 11 && result && (
                        <motion.div
                            key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col w-full h-full inset-0 absolute p-6 overflow-y-auto custom-scrollbar"
                        >
                            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-6 text-center">{t("Cognitive Stability Matrix")}</h2>

                            <div className={cn(
                                "rounded-[24px] p-8 text-center mb-8 border border-white relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]",
                                result.riskBand === "High" ? "bg-rose-50" :
                                    result.riskBand === "Moderate" ? "bg-amber-50" :
                                        "bg-purple-50"
                            )}>
                                <span className={cn(
                                    "text-[80px] font-black tracking-tight leading-none block mb-2 relative z-10 drop-shadow-sm text-transparent bg-clip-text",
                                    result.riskBand === "High" ? "bg-gradient-to-b from-rose-500 to-rose-700" :
                                        result.riskBand === "Moderate" ? "bg-gradient-to-b from-amber-500 to-amber-700" :
                                            "bg-gradient-to-b from-purple-500 to-purple-700"
                                )}>
                                    {result.score}
                                </span>
                                <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm relative z-10 block w-max mx-auto mt-2",
                                    result.riskBand === "High" ? "bg-white text-rose-600 border-rose-200" :
                                        result.riskBand === "Moderate" ? "bg-white text-amber-600 border-amber-200" :
                                            "bg-white text-purple-600 border-purple-200"
                                )}>
                                    {t(result.riskBand)} {t("Phase")}
                                </span>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-bold text-slate-800 mb-4 tracking-wider uppercase text-xs flex items-center gap-2">
                                    <Info className="w-4 h-4 text-purple-600" />
                                    {t("AI Insight")}
                                </h3>
                                <div className="p-5 bg-white rounded-[24px] border border-slate-100 shadow-sm">
                                    <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                                        {result.insight}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={resetQuiz}
                                className="w-full mt-auto py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-[20px] font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <RefreshCcw className="w-4 h-4 text-purple-600" /> {t("Retake Assessment")}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
}
