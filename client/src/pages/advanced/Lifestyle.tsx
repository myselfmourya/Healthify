import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowRight, ArrowLeft, RefreshCcw, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Lifestyle() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [step, setStep] = useState(0); // 0: Intro, 1-N: Questions, 10: Loading, 11: Result
    const [quiz, setQuiz] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const startQuiz = async () => {
        setLoading(true);
        setStep(10);
        try {
            const res = await fetch("/api/advanced/quiz/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: "lifestyle", userId: user.userId })
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
                submitQuiz({ ...answers, [qId]: val });
            }
        }, 300);
    };

    const submitQuiz = async (finalAnswers: Record<string, number>) => {
        setLoading(true);
        setStep(10);
        try {
            const res = await fetch("/api/advanced/quiz/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain: "lifestyle",
                    userId: user.userId,
                    answers: finalAnswers
                })
            });
            const data = await res.json();
            setResult({
                score: data.profile.lifestyleScore,
                tier: parseInt(data.profile.lifestyleScore) > 75 ? "Excellent" :
                    parseInt(data.profile.lifestyleScore) > 45 ? "Average" : "High Risk",
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
        setResult(null);
        setStep(0);
    };

    return (
        <MobileLayout>
            <div className="absolute inset-0 bg-slate-50 z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-100/60 blur-[100px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-100/60 blur-[100px] rounded-full mix-blend-multiply" />
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
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-emerald-600">{t("Vitality Rhythm")}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                            {t("Metabolic Harmony")}
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
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-emerald-50/50 mix-blend-overlay" />
                            <div className="w-24 h-24 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-100 shadow-sm flex items-center justify-center mb-8 relative z-10">
                                <Activity className="w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-wide relative z-10">{t("Evaluate Vitality")}</h2>
                            <p className="text-xs text-slate-500 mb-10 max-w-[250px] mx-auto leading-relaxed relative z-10 font-medium">
                                {t("Conduct an AI-driven behavioral assessment to optimize your metabolic rhythm.")}
                            </p>
                            <button
                                onClick={startQuiz}
                                className="w-full max-w-[200px] py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-[20px] font-bold uppercase tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-3 relative z-10"
                            >
                                {t("Begin Assessment")} <ArrowRight className="w-5 h-5 text-cyan-50" />
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
                                    <div className="h-full bg-cyan-500 shadow-sm transition-all duration-500 ease-out" style={{ width: `${(step / quiz.questions.length) * 100}%` }} />
                                </div>
                            </div>

                            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-4">
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
                                                    ? "bg-cyan-50 border-cyan-300 text-cyan-900"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50/50 hover:text-cyan-800"
                                            )}
                                        >
                                            {t(opt.label)}
                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-cyan-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Loading Step */}
                    {step === 10 && (
                        <motion.div
                            key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center inset-0 absolute p-6"
                        >
                            <div className="w-16 h-16 border-[3px] border-cyan-100 border-t-cyan-500 rounded-full animate-spin mb-6 text-cyan-500 shadow-sm flex items-center justify-center">
                                <Activity className="w-6 h-6 animate-pulse text-cyan-500" />
                            </div>
                            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase animate-pulse">{t("Coalescing Vitality Data...")}</p>
                        </motion.div>
                    )}

                    {/* Results Step */}
                    {step === 11 && result && (
                        <motion.div
                            key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col w-full h-full inset-0 absolute p-6 overflow-y-auto custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500">{t("Vitality Score")}</h2>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm",
                                    result.tier === "High Risk" ? "bg-white text-rose-600 border-rose-200" :
                                        result.tier === "Average" ? "bg-white text-amber-600 border-amber-200" :
                                            "bg-white text-emerald-600 border-emerald-200"
                                )}>
                                    {t(result.tier)}
                                </span>
                            </div>

                            <div className={cn(
                                "rounded-[32px] p-10 text-center mb-8 border border-white relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]",
                                result.tier === "High Risk" ? "bg-rose-50" :
                                    result.tier === "Average" ? "bg-amber-50" :
                                        "bg-emerald-50"
                            )}>
                                <span className={cn(
                                    "text-6xl md:text-7xl font-black tracking-tight leading-none block mb-3 relative z-10 drop-shadow-sm text-transparent bg-clip-text",
                                    result.tier === "High Risk" ? "bg-gradient-to-b from-rose-500 to-rose-700" :
                                        result.tier === "Average" ? "bg-gradient-to-b from-amber-500 to-amber-700" :
                                            "bg-gradient-to-b from-emerald-500 to-emerald-700"
                                )}>
                                    {result.score}
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">{t("Metabolic Harmony Index")}</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-bold text-slate-800 mb-4 tracking-wider uppercase text-xs flex items-center gap-2">
                                    <Info className="w-4 h-4 text-cyan-600" />
                                    {t("AI Recommendations")}
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
                                <RefreshCcw className="w-4 h-4 text-cyan-600" /> {t("Start New Rhythm Check")}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
}
