import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { motion } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp, Bot, Send, User, Sparkles, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
    {
        question: "How is my Health Score calculated?",
        answer: "Your Health Score is a deterministic value out of 100 calculated by combining four core metrics:\n\n• Physical Vitals: Derived from BMI, Heart Rate, and Blood Pressure.\n• Genetic Risks: Factored in from the conditions logged in your Family Hub.\n• Mental Wellness: Based on your latest Mind Check cognitive stability score.\n• Daily Lifestyle: Derived from your tracked daily habits and sleep logging."
    },
    {
        question: "What is the Body Scan (Radar)?",
        answer: "The Body Scan is an interactive clinical assessment. Based on your profile and previous answers, it dynamically generates medical parameter questions using AI to identify potential health risks like cardiovascular or metabolic issues."
    },
    {
        question: "Are my family's genetic records kept safe?",
        answer: "Yes, all data entered into the Family Hub for genetic risk calculation is stored securely within your private Healthify profile. It is only used to generate susceptibility scores and preventive roadmaps."
    },
    {
        question: "How do I upgrade to Pro Mode?",
        answer: "Pro Mode is free to access during the beta. You can switch between Beginner and Pro modes at any time from the Settings tab to simplify the interface or access advanced clinical tools."
    }
];

export default function Support() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "ai", text: string }[]>([
        { role: "ai", text: t("Hi! I'm the Healthify Support AI. How can I help you understand the app today?") }
    ]);
    const [loading, setLoading] = useState(false);

    const askSupport = async () => {
        if (!query.trim()) return;
        setMessages(p => [...p, { role: "user", text: query }]);
        setQuery("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: query, context: { appMode: user.appMode } })
            });
            const data = await res.json();
            setMessages(p => [...p, { role: "ai", text: data.reply }]);
        } catch (err) {
            setMessages(p => [...p, { role: "ai", text: t("Sorry, our support systems are currently offline. Please check your internet connection or try again later.") }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout>
            <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] animate-in fade-in duration-500 max-w-6xl mx-auto w-full">

                {/* Header Area */}
                <div className="flex items-center gap-4 mb-6 pt-2">
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center gap-2">
                            <HelpCircle className="w-6 h-6 text-emerald-600" />
                            {t("Help & Support")}
                        </h1>
                        <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-600/70 mt-1">
                            {t("Healthify Knowledge Base")}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                    {/* Left Column: FAQ & Documentation */}
                    <div className="flex flex-col overflow-y-auto pr-2 custom-scrollbar lg:col-span-5">
                        <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-6 border border-emerald-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] mb-6 h-fit">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-500" />
                                {t("Frequently Asked Questions")}
                            </h2>
                            <div className="space-y-3">
                                {FAQS.map((faq, i) => (
                                    <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:border-emerald-200 transition-colors">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                            className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-800"
                                        >
                                            {t(faq.question)}
                                            {openFaq === i ? <ChevronUp className="w-4 h-4 text-emerald-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                                        </button>
                                        {openFaq === i && (
                                            <div className="p-4 pt-0 text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 border-t border-slate-50">
                                                {t(faq.answer).split('\n').map((line, idx) => (
                                                    <p key={idx} className={line.startsWith('•') ? "pl-2 mb-1" : "mb-2"}>{line}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Support Chat */}
                    <div className="flex flex-col bg-white/95 backdrop-blur-xl rounded-[24px] border border-emerald-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden lg:col-span-7">
                        <div className="p-4 border-b border-emerald-50 bg-emerald-50/50 flex items-center justify-between">
                            <h2 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                <Bot className="w-4 h-4" />
                                {t("Live AI Support")}
                            </h2>
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t("Online")}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/50">
                            {messages.map((msg, i) => (
                                <div key={i} className={cn("flex items-start gap-3 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                                    <div className={cn("w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm",
                                        msg.role === "ai" ? "bg-emerald-100 text-emerald-600" : "bg-slate-900 text-white"
                                    )}>
                                        {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>
                                    <div className={cn("p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        msg.role === "ai" ? "bg-white border text-slate-700 rounded-tl-none border-emerald-50" : "bg-emerald-600 text-white rounded-tr-none"
                                    )}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex items-start gap-3 max-w-[85%]">
                                    <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm bg-emerald-100 text-emerald-600">
                                        <Bot className="w-4 h-4 animate-pulse" />
                                    </div>
                                    <div className="p-4 rounded-2xl rounded-tl-none bg-white border border-emerald-50 shadow-sm flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-bounce" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-emerald-50">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-[16px] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && askSupport()}
                                    placeholder={t("Ask me how a feature works...")}
                                    className="flex-1 bg-transparent border-none text-sm px-3 py-2 outline-none text-slate-800 placeholder:text-slate-400"
                                />
                                <button
                                    onClick={askSupport}
                                    disabled={!query || loading}
                                    className="w-10 h-10 shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:grayscale transition-colors text-white rounded-xl flex items-center justify-center shadow-md p-2"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </MobileLayout>
    );
}
