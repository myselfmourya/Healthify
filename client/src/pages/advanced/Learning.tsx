import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Sparkles, ChevronRight, ArrowLeft } from "lucide-react";
import { debouncedAIFetch } from "@/lib/api";
import { Link } from "wouter";

import { cn } from "@/lib/utils";

export default function Learning() {
    const { t } = useStrictTranslation();
    const [query, setQuery] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const learn = async (concept: string) => {
        if (!concept.trim()) return;
        setLoading(true);
        setResult("");

        debouncedAIFetch(
            {
                endpoint: "/api/ai/chat",
                payload: { message: `Explain the medical concept "${concept}" in very simple, easy-to-understand terms suitable for someone without a medical background. Keep it to 2-3 short paragraphs max with 3 bullet points of key takeaways.` }
            },
            (data) => {
                setResult(data.reply);
                setLoading(false);
            },
            () => setLoading(false)
        );
    };

    const suggestions = [t("What is Hypertension?"), t("How do Vaccines work?"), t("Understanding Cholesterol"), t("Type 2 Diabetes simply explained")];

    return (
        <MobileLayout>
            <div className="absolute inset-0 bg-slate-50 z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-100/60 blur-[120px] rounded-full mix-blend-multiply opacity-70" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/60 blur-[120px] rounded-full mix-blend-multiply opacity-70" />
            </div>

            <div className="mb-8 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <a className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-colors backdrop-blur-md">
                            <ArrowLeft className="w-5 h-5" />
                        </a>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">{t("Episteme Hub")}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                            {t("Knowledge Architecture")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-10 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 blur-3xl rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity" />
                <h2 className="font-black text-slate-800 mb-8 tracking-[0.2em] uppercase text-[10px] opacity-60 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    {t("Query Matrix")}
                </h2>

                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-purple-300" />
                    </div>
                    <input
                        type="text"
                        placeholder={t("Initialize concept query... (e.g. Endometriosis)")}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && learn(query)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-sm text-slate-800 font-bold focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder-slate-300"
                    />
                </div>

                <button
                    onClick={() => learn(query)}
                    disabled={loading || !query}
                    className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:grayscale text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl group"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                        <>
                            {t("Synthesize Understanding")}
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {!result && !loading && (
                    <motion.div
                        key="suggestions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="mb-20"
                    >
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">{t("Deep Knowledge Nodes")}</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setQuery(s); learn(s); }}
                                    className="w-full flex items-center justify-between p-6 bg-white/60 border border-white rounded-[28px] hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all text-left group backdrop-blur-md shadow-sm"
                                >
                                    <span className="font-bold tracking-tight text-slate-700 text-sm">{t(s)}</span>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {result && !loading && (
                    <motion.div
                        key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/90 rounded-[40px] p-8 md:p-12 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden backdrop-blur-3xl mb-24"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/30 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />

                        <div className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-[10px] tracking-[0.2em] uppercase text-purple-600 mb-1">{t("Neural Synthesis")}</h3>
                                <p className="text-xl font-black text-slate-800 tracking-tight">{query}</p>
                            </div>
                        </div>

                        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed text-base relative z-10">
                            <div className="whitespace-pre-wrap font-medium tracking-tight space-y-4">
                                {result.split('\n').map((line, idx) => {
                                    if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
                                        return (
                                            <div key={idx} className="flex gap-4 items-start bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                                                <p className="text-sm font-bold text-slate-700">{line.replace(/^[-*]\s+/, "")}</p>
                                            </div>
                                        );
                                    }
                                    return <p key={idx} className={cn(line.length < 50 ? "font-black text-slate-800" : "")}>{line}</p>;
                                })}
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("Generated by Knowledge Engine")}</span>
                            <button onClick={() => setResult("")} className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline transition-all underline-offset-4">{t("Reset Terminal")}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && (
                <div className="py-32 flex flex-col items-center justify-center mb-24 backdrop-blur-sm rounded-[40px] bg-white/30 border border-white/50 border-dashed">
                    <div className="w-20 h-20 border-[3px] border-purple-100 border-t-purple-600 rounded-full animate-spin mb-8 text-purple-600 shadow-2xl flex items-center justify-center">
                        <BookOpen className="w-8 h-8 absolute animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] animate-pulse">{t("Synthesizing Clinical Knowledge...")}</p>
                </div>
            )}
        </MobileLayout>
    );
}
