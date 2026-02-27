import { useState, useRef, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import {
    Send, Mic, Image as ImageIcon, Sparkles, Activity, Stethoscope, Brain, RefreshCw,
    CircleAlert, Pill, ShieldCheck, UserRound, ChevronRight, BarChart3, MicOff, History, Plus, X, Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useSearchParams } from "@/hooks/useSearchParams";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";
import { debouncedAIFetch } from "@/lib/api";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";

// ─── Symptom Checker Tab ────────────────────────────────────────────────────
const QUICK_SYMPTOMS = ["Fever", "Headache", "Chest Pain", "Back Pain", "Cough", "Stomach Ache", "Fatigue", "Dizziness"];

function SymptomChecker() {
    const { user } = useUser();
    const { addNotification } = useNotifications();
    const { t } = useStrictTranslation();
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const check = async (symptoms: string) => {
        setLoading(true); setError(""); setResult(null);
        debouncedAIFetch(
            {
                endpoint: "/api/ai/symptom-check",
                payload: { symptoms, userProfile: { age: user.age, gender: user.gender, diseases: user.diseases } }
            },
            (data) => {
                setResult(data);
                if (data.severity === "severe") {
                    addNotification({ type: "alert", title: t("Severe Symptom Alert"), message: `${t("Based on your symptoms")}: ${t(data.condition)}. ${t("Please see a doctor")}.` });
                }
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );
    };

    const severityColor = { mild: "text-green-600 bg-green-50", moderate: "text-amber-600 bg-amber-50", severe: "text-red-600 bg-red-50" };

    return (
        <div>
            <div className="relative mb-3">
                <textarea
                    className="w-full px-4 py-3.5 pr-14 rounded-2xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-blue-500 shadow-sm"
                    rows={3} placeholder={t("Describe your symptoms in detail... (e.g., 'I have a headache and mild fever since yesterday')")}
                    value={input} onChange={(e) => setInput(e.target.value)}
                />
                <button
                    onClick={() => input && check(input)}
                    disabled={!input || loading}
                    className={cn("absolute bottom-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        input && !loading ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400")}
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex gap-2 flex-wrap mb-5">
                {QUICK_SYMPTOMS.map((s) => (
                    <button key={s} onClick={() => { setInput((p) => p ? `${p}, ${t(s)}` : t(s)); }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors">
                        + {t(s)}
                    </button>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
                    <CircleAlert className="w-4 h-4 inline mr-2" />{error}
                </div>
            )}

            {loading && (
                <div className="glass rounded-2xl p-6 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">{t("Analyzing your symptoms with AI...")}</p>
                    <p className="text-xs text-gray-400 mt-1">{t("Using Mistral AI model")}</p>
                </div>
            )}

            {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className={cn("rounded-2xl p-4 flex items-center justify-between", severityColor[result.severity as keyof typeof severityColor])}>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{t("Possible Condition")}</p>
                            <p className="text-lg font-bold">{t(result.condition)}</p>
                        </div>
                        <span className={cn("text-xs font-bold px-3 py-1 rounded-full border capitalize", severityColor[result.severity as keyof typeof severityColor])}>
                            {t(result.severity)}
                        </span>
                    </div>

                    {[
                        { icon: CircleAlert, label: t("Possible Causes"), items: result.causes, color: "text-orange-600", bg: "bg-orange-50" },
                        { icon: Pill, label: t("Suggested Medicines"), items: result.medicines, color: "text-blue-600", bg: "bg-blue-50" },
                        { icon: ShieldCheck, label: t("Precautions"), items: result.precautions, color: "text-green-600", bg: "bg-green-50" },
                    ].map(({ icon: Icon, label, items, color, bg }) => (
                        <div key={label} className={cn("rounded-2xl p-4", bg)}>
                            <div className={cn("flex items-center gap-2 mb-2 font-bold text-sm", color)}>
                                <Icon className="w-4 h-4" />{label}
                            </div>
                            <ul className="space-y-1">
                                {items?.map((item: string, i: number) => (
                                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                        <span className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", color.replace("text", "bg"))} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="glass rounded-2xl p-4 flex items-center gap-3">
                        <UserRound className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">{t("Recommended specialist")}</p>
                            <p className="text-sm font-bold text-gray-900">{t(result.doctorType)}</p>
                        </div>
                        <a href="/consult" className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                            {t("Book")} <ChevronRight className="w-3 h-3" />
                        </a>
                    </div>

                    <p className="text-[11px] text-gray-400 text-center">⚠️ {t("AI analysis for informational purposes only. Always consult a doctor for medical advice.")}</p>
                </motion.div>
            )}
        </div>
    );
}

// ─── Health Assistant Chat Tab ──────────────────────────────────────────────
interface Message { role: "user" | "assistant"; text: string; timestamp: Date; imageUrl?: string; }

function HealthAssistant() {
    const { user } = useUser();
    const { t } = useStrictTranslation();
    const defaultGreeting: Message = { role: "assistant", text: `${t("Hello")} ${user.name || t("there")}! 👋 ${t("I'm MIYA, your personal AI health assistant. I can help you with symptoms, general health queries, and more. How are you feeling today?")}`, timestamp: new Date() };
    const [messages, setMessages] = useState<Message[]>([defaultGreeting]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ id: string, date: Date, preview: string, messages: Message[] }[]>([]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem("healthify_ai_history");
        if (saved) {
            try {
                const parsed = JSON.parse(saved).map((chat: any) => ({
                    ...chat,
                    date: new Date(chat.date),
                    messages: chat.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
                }));
                setChatHistory(parsed);
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading, showHistory]);

    const saveCurrentChat = () => {
        if (messages.length <= 1) return;
        const newChat = {
            id: Date.now().toString(),
            date: new Date(),
            preview: messages.find(m => m.role === 'user')?.text || t("Chat session"),
            messages: [...messages]
        };
        const updated = [newChat, ...chatHistory];
        setChatHistory(updated);
        localStorage.setItem("healthify_ai_history", JSON.stringify(updated));
        setMessages([defaultGreeting]);
    };

    const loadChat = (id: string) => {
        const chat = chatHistory.find(c => c.id === id);
        if (chat) {
            setMessages(chat.messages);
            setShowHistory(false);
        }
    };

    const send = async (text: string, imageUrl?: string) => {
        if (!text.trim() && !imageUrl) return;
        const userMsg: Message = { role: "user", text, timestamp: new Date(), imageUrl };
        setMessages((p) => [...p, userMsg]);
        setInput(""); setError("");
        setLoading(true);

        // Keep last 10 messages for context
        const history = messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.text,
            ...(m.imageUrl ? { imageUrl: m.imageUrl } : {})
        }));

        debouncedAIFetch(
            {
                endpoint: "/api/ai/chat",
                payload: {
                    message: text || t("I have uploaded an image. Please analyze it."),
                    history,
                    imageUrl,
                    userName: user.name || t("User"),
                    userProfile: { age: user.age, gender: user.gender, diseases: user.diseases }
                }
            },
            (data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    const cleanReply = data.reply
                        .replace(/\*\*/g, "") // Remove bolding
                        .replace(/^[-*]\s+/gm, "• "); // Make standard bullet points

                    setMessages((p) => [...p, { role: "assistant", text: cleanReply, timestamp: new Date() }]);

                    if (voiceMode && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                        const utterThis = new SpeechSynthesisUtterance(cleanReply);
                        utterThis.lang = "en-IN";
                        utterThis.onstart = () => setIsSpeaking(true);
                        utterThis.onend = () => setIsSpeaking(false);
                        utterThis.onerror = () => setIsSpeaking(false);
                        window.speechSynthesis.speak(utterThis);
                    }
                }
                setLoading(false);
            },
            (err) => {
                setError(err);

                const query = text.toLowerCase();
                let offlineReply = t("I'm having trouble connecting to the internet right now. Please check your connection.");

                if (query.includes("fever")) offlineReply = t("For a mild fever, rest and drink plenty of fluids. Take paracetamol if needed. If it exceeds 103°F (39.5°C) or lasts over 3 days, see a doctor.");
                else if (query.includes("cold") || query.includes("cough")) offlineReply = t("For a cold, stay hydrated, use honey for coughs, and rest. If you have trouble breathing or chest pain, seek medical help immediately.");
                else if (query.includes("headache")) offlineReply = t("Rest in a quiet, dark room, stay hydrated, and take a mild pain reliever if needed. If it's the worst headache of your life or accompanied by vision changes, go to emergency.");
                else if (query.includes("vomiting") || query.includes("stomach") || query.includes("belly")) offlineReply = t("For stomach pain or vomiting, stay hydrated with small sips of water or ORS. Avoid solid foods until vomiting stops. Seek help if you can't keep fluids down for 24 hours or have severe pain.");
                else if (query.includes("burn") || query.includes("cut")) offlineReply = t("For minor cuts or burns, clean with cool water and apply a sterile bandage. If it's a deep cut that won't stop bleeding or a large burn, seek emergency care.");
                else if (query.includes("hello") || query.includes("hi ") || query.includes("hey")) offlineReply = t("Hello! I am operating in offline mode right now, but I can still answer basic questions about fever, cold, headache, and stomach pain. How can I help?");

                setMessages((p) => [...p, { role: "assistant", text: offlineReply, timestamp: new Date() }]);
                setLoading(false);
            }
        );
    };

    const startVoice = (autoSend = false) => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert(t("Voice input not supported in this browser.")); return; }
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsSpeaking(false);

        const rec = new SpeechRecognition();
        rec.lang = "en-IN";
        rec.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            setInput(transcript);
            setIsRecording(false);
            if (autoSend) {
                setTimeout(() => send(transcript), 500);
            }
        };
        rec.onend = () => setIsRecording(false);
        rec.start();
        recognitionRef.current = rec;
        setIsRecording(true);
    };

    const stopVoice = () => {
        recognitionRef.current?.stop();
        setIsRecording(false);
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Mistral pixtral API needs data URL format e.g. data:image/jpeg;base64,...
            send(t(`Please analyze this ${file.type.includes("pdf") ? "document" : "medical image"} I've uploaded.`), base64String);
        };
        reader.readAsDataURL(file);
    };

    const SUGGESTIONS = [t("What are signs of diabetes?"), t("How to lower blood pressure?"), t("What should I eat for heart health?"), t("Explain my BMI")];

    if (showHistory) {
        return (
            <div className="flex flex-col h-[65vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">{t("Chat History")}</h3>
                    <div className="flex gap-3 items-center">
                        {chatHistory.length > 0 && (
                            <button onClick={() => {
                                localStorage.removeItem("healthify_ai_history");
                                setChatHistory([]);
                            }} className="text-sm text-red-500 font-bold hover:text-red-700">{t("Clear All")}</button>
                        )}
                        <button onClick={() => setShowHistory(false)} className="text-sm text-blue-600 font-bold">{t("Back")}</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                    {chatHistory.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 text-sm">{t("No saved chats yet.")}</div>
                    ) : (
                        chatHistory.map(chat => (
                            <div key={chat.id} onClick={() => loadChat(chat.id)} className="glass rounded-2xl p-4 cursor-pointer hover:bg-white/60 transition-colors">
                                <p className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{chat.preview}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>{chat.date.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}</span>
                                    <span>{chat.messages.length} {t("messages")}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[65vh]">
            {/* Top Bar for Chat */}
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (messages.length > 1) saveCurrentChat();
                            else setMessages([defaultGreeting]);
                        }}
                        className="text-xs bg-white border border-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-gray-600 font-bold hover:bg-gray-50 shadow-sm"
                    >
                        <Plus className="w-3 h-3" /> {t("New")}
                    </button>
                    <button
                        onClick={() => { setVoiceMode(true); startVoice(true); }}
                        className="text-xs bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-blue-700 font-bold hover:bg-blue-100 shadow-sm transition-colors"
                    >
                        <Volume2 className="w-3 h-3" /> {t("Voice Mode")}
                    </button>
                </div>
                <button
                    onClick={() => setShowHistory(true)}
                    className="text-xs bg-white border border-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-gray-600 font-bold hover:bg-gray-50 shadow-sm"
                >
                    <History className="w-3 h-3" /> {t("History")}
                </button>
            </div>

            {voiceMode ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl mb-4 relative overflow-hidden shadow-inner w-full mt-2">
                    <button onClick={() => { setVoiceMode(false); stopVoice(); }} className="absolute top-4 right-4 text-white/50 hover:text-white p-2 bg-white/10 rounded-full transition-colors z-20">
                        <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-white/80 font-bold mb-16 text-center text-lg z-10 transition-all">
                        {loading ? t("Thinking...") : isSpeaking ? t("MIYA is speaking...") : isRecording ? t("Listening...") : t("Tap the orb to speak")}
                    </h3>

                    <button
                        onClick={() => isRecording ? stopVoice() : startVoice(true)}
                        className="relative group z-10"
                    >
                        {/* Glow effects */}
                        <div className={cn("absolute inset-0 rounded-full blur-3xl transition-all duration-700",
                            isRecording ? "bg-red-500/60 scale-[1.8] animate-pulse" :
                                isSpeaking ? "bg-cyan-500/60 scale-[1.8] animate-pulse" :
                                    loading ? "bg-purple-500/50 scale-[1.5] animate-spin" :
                                        "bg-blue-500/40 scale-[1.2] group-hover:scale-[1.3]"
                        )} />

                        {/* Core Orb */}
                        <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-900 via-blue-800 to-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.6)] flex items-center justify-center border-2 border-white/20">
                            {isRecording ? <Mic className="w-10 h-10 text-white animate-bounce" /> : <Sparkles className="w-10 h-10 text-white" />}
                        </div>
                    </button>

                    <div className="mt-16 h-20 flex items-center justify-center z-10 w-full">
                        {loading ? null : isRecording && input ? (
                            <p className="text-white/60 text-center max-w-[280px] italic">"{input}"... </p>
                        ) : messages.length > 1 ? (
                            <p className="text-white/90 text-center max-w-[280px] font-medium text-lg leading-snug">"{messages[messages.length - 1].text.length > 90 ? messages[messages.length - 1].text.slice(0, 90) + "..." : messages[messages.length - 1].text}"</p>
                        ) : null}
                    </div>
                </div>
            ) : (
                <>
                    {/* Chat */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3 scrollbar-none">
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                                    msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "glass rounded-bl-sm")}>
                                    {msg.role === "assistant" && (
                                        <div className="flex items-center gap-1.5 mb-1.5 text-blue-600 font-bold text-[11px] uppercase tracking-wider">
                                            <Sparkles className="w-3 h-3" /> MIYA
                                        </div>
                                    )}
                                    {msg.imageUrl && (
                                        <img src={msg.imageUrl} alt="User uploaded" className="max-w-[200px] w-full rounded-xl mb-2 border border-white/20 shadow-sm" />
                                    )}
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    <p className={cn("text-[10px] mt-1", msg.role === "user" ? "text-blue-200" : "text-gray-400")}>
                                        {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-blue-600 font-bold text-[11px]">
                                        <Sparkles className="w-3 h-3" /> MIYA
                                    </div>
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <motion.div key={i} className="w-2 h-2 bg-blue-400 rounded-full"
                                                animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick suggestions */}
                    {messages.length <= 2 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
                            {SUGGESTIONS.map((s) => (
                                <button key={s} onClick={() => send(s)}
                                    className="shrink-0 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-2 rounded-full whitespace-nowrap hover:bg-blue-100">
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="glass rounded-2xl p-2 flex items-center gap-2 mt-2 shrink-0 border border-white/60">
                        <input type="file" ref={fileRef} accept="image/*,.pdf" className="hidden" onChange={handleImage} />
                        <button onClick={() => fileRef.current?.click()}
                            className="p-2.5 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <input
                            className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400"
                            placeholder={t("Ask about your health...")}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                        />
                        {input ? (
                            <button onClick={() => send(input)} disabled={loading}
                                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                                <Send className="w-5 h-5" />
                            </button>
                        ) : (
                            <button onClick={() => isRecording ? stopVoice() : startVoice()}
                                className={cn("p-2.5 rounded-xl transition-colors", isRecording ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-blue-50")}>
                                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Predictive Health Tab ──────────────────────────────────────────────────
function PredictiveHealth() {
    const { user, bmi, bmiCategory } = useUser();
    const { t } = useStrictTranslation();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const predict = async () => {
        if (!user.height || !user.weight) {
            setError(t("Please complete your profile (height, weight) first in Settings.")); return;
        }
        setLoading(true); setError("");

        debouncedAIFetch(
            {
                endpoint: "/api/ai/predict",
                payload: { profile: { age: user.age, gender: user.gender, height: user.height, weight: user.weight, diseases: user.diseases } }
            },
            (data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setResult(data);
                }
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );
    };

    const riskColor = (val: number) => val >= 70 ? "#ef4444" : val >= 40 ? "#f59e0b" : "#22c55e";
    const riskLabel = (val: number) => val >= 70 ? "High Risk" : val >= 40 ? "Moderate" : "Low Risk";

    const chartData = result ? [
        { name: "Diabetes", value: result.diabetesRisk, fill: riskColor(result.diabetesRisk) },
        { name: "Heart", value: result.heartRisk, fill: riskColor(result.heartRisk) },
        { name: "BP", value: result.bpRisk, fill: riskColor(result.bpRisk) },
    ] : [];

    return (
        <div>
            {/* Profile Summary */}
            <div className="glass rounded-2xl p-4 mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t("Your Health Profile")}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <p className="text-lg font-bold text-blue-700">{bmi > 0 ? bmi : "--"}</p>
                        <p className="text-xs text-gray-500">{t("BMI")} ({t(bmiCategory)})</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-blue-700">{user.age || "--"}</p>
                        <p className="text-xs text-gray-500">{t("Age (yrs)")}</p>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-blue-700">{user.diseases?.length || 0}</p>
                        <p className="text-xs text-gray-500">{t("Conditions")}</p>
                    </div>
                </div>
                {user.diseases?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {user.diseases.map(d => (
                            <span key={d} className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-medium">{d}</span>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={predict}
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mb-4"
            >
                {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> {t("Analyzing with AI")}...</> : <><Brain className="w-5 h-5" /> {t("Run Health Prediction")}</>}
            </button>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4">
                    {error}
                </div>
            )}

            {result && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Risk Bars */}
                    {chartData.map(({ name, value, fill }) => (
                        <div key={name} className="glass rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-bold text-gray-900">{t(name)} {t("Risk")}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold" style={{ color: fill }}>{value}%</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: fill, backgroundColor: `${fill}20` }}>
                                        {t(riskLabel(value))}
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-2.5 rounded-full"
                                    style={{ backgroundColor: fill }}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Suggestions */}
                    <div className="glass rounded-2xl p-4">
                        <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-green-600" /> {t("Preventive Suggestions")}
                        </p>
                        <ul className="space-y-2">
                            {result.suggestions?.map((s: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />{s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Alerts */}
                    {result.alerts?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                            <p className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                                <CircleAlert className="w-4 h-4" /> {t("Health Alerts")}
                            </p>
                            {result.alerts.map((a: string, i: number) => <p key={i} className="text-sm text-red-600">{t(a)}</p>)}
                        </div>
                    )}

                    <p className="text-[11px] text-gray-400 text-center">{t("AI predictions for awareness only. Consult a doctor for diagnosis.")}</p>
                </motion.div>
            )}
        </div>
    );
}

// ─── Main AIFeatures Page ───────────────────────────────────────────────────
export default function AIFeatures() {
    const { t } = useStrictTranslation();
    const TABS = [
        { id: "symptoms", label: t("Symptoms"), icon: Stethoscope },
        { id: "chat", label: t("Assistant"), icon: Sparkles },
        { id: "predict", label: t("Predict"), icon: Brain },
    ];
    const [activeTab, setActiveTab] = useState("chat");

    // Read tab from URL query string
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get("tab");
        if (t && TABS.find(tab => tab.id === t)) setActiveTab(t);
    }, []);

    return (
        <MobileLayout>
            <div className="animate-in fade-in duration-500">
                <div className="flex flex-col h-full bg-white relative">
                    <div className="px-5 py-4 shrink-0 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur z-10">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                MIYA <span className="text-blue-600">{t("Health AI")}</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-bold text-[10px] uppercase tracking-wider border border-green-100 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {t("MIYA Online")}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                                    activeTab === id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                            >
                                <Icon className="w-3.5 h-3.5" />{label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-4 pb-20"
                        >
                            {activeTab === "symptoms" && <SymptomChecker />}
                            {activeTab === "chat" && <HealthAssistant />}
                            {activeTab === "predict" && <PredictiveHealth />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </MobileLayout>
    );
}
