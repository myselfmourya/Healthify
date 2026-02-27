import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ArrowLeft, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MiyaVoice() {
    const { languageCode } = useLanguage();
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const recognitionRef = useRef<any>(null);
    const synthRef = window.speechSynthesis;

    const SUGGESTIONS = [
        "What are the risks of high cholesterol?",
        "Is there a connection between sleep and heart health?",
        "Tell me about Type 2 Diabetes prevention.",
    ];

    const stopAll = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (synthRef) synthRef.cancel();
        setIsListening(false);
        setIsSpeaking(false);
    }, [synthRef]);

    useEffect(() => {
        return () => stopAll();
    }, [stopAll]);

    const speakAndListen = (text: string) => {
        if (!synthRef) return;
        synthRef.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synthRef.getVoices();

        // Strictly filter for selected language + prefer Indian Female if English
        let selectedVoice = null;
        const normalizedLang = languageCode.toLowerCase();

        if (normalizedLang.startsWith('en')) {
            // Strictly prefer Indian English Female
            selectedVoice = voices.find(v => (v.lang.includes("en-IN") || v.lang.includes("en_IN")) && (v.name.toLowerCase().includes("female") || ["Aditi", "Heera", "Zira", "Priya"].some(n => v.name.includes(n))));
            // Fallback to any Female English if Indian not available
            if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"));
        } else if (normalizedLang.startsWith('hi')) {
            // Strictly prefer Hindi Female
            selectedVoice = voices.find(v => v.lang.includes("hi-IN") && (v.name.toLowerCase().includes("female") || ["Kalpana", "Lekha", "Sangeeta"].some(n => v.name.includes(n))));
            // Fallback to any Female voice
            if (!selectedVoice) selectedVoice = voices.find(v => v.name.toLowerCase().includes("female"));
        }

        // Final fallback to any female voice in the system regardless of lang
        if (!selectedVoice) selectedVoice = voices.find(v => v.name.toLowerCase().includes("female"));

        // Fallback to any voice matching exact lang code if preferred not found
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(normalizedLang.split('-')[0]));
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.lang = languageCode;
        utterance.rate = 1.0;
        utterance.pitch = 1.1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(true); // Small delay before listening
            setTimeout(() => {
                setIsSpeaking(false);
                startListening();
            }, 100);
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            startListening();
        };

        synthRef.speak(utterance);
    };

    const processVoiceInput = async (text: string) => {
        setIsListening(false);
        setTranscript(text);
        setAiResponse(t("Thinking..."));

        // Map language code to human readable name for the AI prompt
        const langMap: Record<string, string> = {
            "en": "English",
            "en-IN": "Indian English",
            "hi": "Hindi",
            "hi-IN": "Hindi"
        };
        const targetLang = langMap[languageCode] || "English";

        // Offline Fallback Check
        if (!navigator.onLine) {
            const { findOfflineMedicalMatch } = await import("@/lib/offlineMedicalDictionary");
            const match = findOfflineMedicalMatch(text);

            if (match) {
                const response = `[Offline Mode] ${match.condition}: ${match.precautions.join(", ")}. Medicines: ${match.medicines.map(m => m.name).join(", ") || "None"}. ${match.whenToSeeDoctor}`;
                setAiResponse(response);
                speakAndListen(response);
                return;
            } else {
                const fallbackMsg = t("I'm currently offline and couldn't find information about that. Please check your connection for a full consultation.");
                setAiResponse(fallbackMsg);
                speakAndListen(fallbackMsg);
                return;
            }
        }

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `CRITICAL: Respond ONLY in ${targetLang}. 
                             User Profile: Mourya.
                             Tone: Warm, Indian Female Health Assistant.
                             Task: Respond correctly and medically responsibly to "${text}".
                             Formatting: Use clear, simple bullet points. Keep it punchy and professional.`,
                    history: [],
                    userName: user.name || "Mourya"
                })
            });

            if (!res.ok) throw new Error("API Failed");

            const data = await res.json();
            setAiResponse(data.reply);

            // Ensure voices are loaded before speaking
            if (synthRef.getVoices().length === 0) {
                const voiceLoader = () => {
                    speakAndListen(data.reply);
                    window.speechSynthesis.removeEventListener('voiceschanged', voiceLoader);
                };
                window.speechSynthesis.addEventListener('voiceschanged', voiceLoader);
            } else {
                speakAndListen(data.reply);
            }
        } catch (e) {
            // Secondary Fallback if API fails online
            const { findOfflineMedicalMatch } = await import("@/lib/offlineMedicalDictionary");
            const match = findOfflineMedicalMatch(text);
            if (match) {
                const response = `${match.condition}: ${match.precautions.join(", ")}. ${match.whenToSeeDoctor}`;
                setAiResponse(response);
                speakAndListen(response);
            } else {
                setAiResponse(t("Sorry, I had trouble connecting."));
                speakAndListen(t("Sorry, I had trouble connecting."));
            }
        }
    };

    const startListening = () => {
        if (isSpeaking) synthRef.cancel();

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(t("Voice recognition is not supported in this browser. Please try Chrome or Safari."));
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }

        try {
            const rec = new SpeechRecognition();
            // Simplify for Safari compatibility (removed strict lang and interimResults)
            rec.lang = languageCode === "en" ? "en-IN" : languageCode;

            rec.onstart = () => setIsListening(true);
            rec.onresult = (e: any) => {
                const resultText = e.results[0][0].transcript;
                processVoiceInput(resultText);
            };
            rec.onerror = (e: any) => {
                console.error("Speech recognition error:", e.error);
                setIsListening(false);
                if (e.error === 'not-allowed') {
                    alert(t("Please allow microphone permissions in your browser settings to use voice features."));
                } else if (e.error !== 'no-speech') {
                    setAiResponse(t(`Microphone error: ${e.error}. Please try again.`));
                }
            };
            rec.onend = () => setIsListening(false);

            rec.start();
            recognitionRef.current = rec;
        } catch (err: any) {
            console.error("Failed to start SpeechRecognition:", err);
            setIsListening(false);
            alert(t("Failed to access microphone. Please ensure permissions are granted."));
        }
    };

    const toggleVoice = () => {
        if (isListening || isSpeaking) stopAll();
        else startListening();
    };

    // Pre-load voices
    useEffect(() => {
        if (synthRef) {
            synthRef.getVoices();
            const handle = () => synthRef.getVoices();
            window.speechSynthesis.addEventListener('voiceschanged', handle);
            return () => window.speechSynthesis.removeEventListener('voiceschanged', handle);
        }
    }, [synthRef]);

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5) return t("Good Night");
        if (hour < 12) return t("Good Morning");
        if (hour < 17) return t("Good Afternoon");
        return t("Good Evening");
    };

    return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col p-8 relative overflow-hidden font-sans">
            {/* Clean Background - Removing mesh gradients for simplicity */}

            {/* Header Content */}
            <div className="z-20 flex justify-between items-center mb-12">
                <Link href="/">
                    <a className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                </Link>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{getTimeGreeting()},</p>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">{user.name || "User"}</h1>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                            <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-slate-300" />
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content - Centered & Simple */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full z-20">
                <AnimatePresence mode="wait">
                    {!aiResponse && !transcript && (
                        <motion.div
                            key="initial-state" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{t("How can I help?")}</h2>
                                <p className="text-slate-400 text-sm font-medium">{t("Tap the mic to start your health consultation")}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => processVoiceInput(s)}
                                        className="px-6 py-4 bg-white/50 border border-slate-100 rounded-2xl text-slate-600 text-sm font-bold hover:bg-white hover:border-slate-200 hover:shadow-md transition-all text-center"
                                    >
                                        {t(s)}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {transcript && !aiResponse && (
                        <motion.div
                            key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center"
                        >
                            <p className="text-2xl font-bold text-slate-400 italic leading-relaxed">"{transcript}"</p>
                        </motion.div>
                    )}

                    {aiResponse && (
                        <motion.div
                            key="response" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="w-full space-y-6"
                        >
                            <div className="flex items-center gap-2 justify-center mb-4">
                                <div className="w-8 h-[1px] bg-slate-200" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">{t("MIYA")}</span>
                                <div className="w-8 h-[1px] bg-slate-200" />
                            </div>

                            <div className="space-y-6 text-center">
                                {aiResponse.split('\n').map((line, idx) => {
                                    const trimmed = line.trim();
                                    if (!trimmed) return <div key={idx} className="h-2" />;
                                    if (trimmed.startsWith('*') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
                                        return (
                                            <div key={idx} className="flex gap-3 items-start justify-center text-left max-w-md mx-auto">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 shrink-0" />
                                                <p className="text-lg font-bold text-slate-700">{trimmed.replace(/^[-*]|\d+\.\s+/, "").replace(/\*\*/g, "")}</p>
                                            </div>
                                        );
                                    }
                                    return <p key={idx} className="text-xl font-black text-slate-800 leading-tight">{trimmed.replace(/\*\*/g, "")}</p>;
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mic Interaction - Simplified, No Floating Orbs */}
            <div className="z-20 py-12 flex flex-col items-center mt-auto">
                <button
                    onClick={toggleVoice}
                    className={cn(
                        "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
                        isSpeaking || isListening ? "bg-slate-900 shadow-2xl scale-110" : "bg-white border border-slate-200 shadow-lg hover:shadow-xl active:scale-95"
                    )}
                >
                    {isSpeaking ? (
                        <div className="flex gap-1.5 h-6 items-center">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [8, 24, 8, 16, 8] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                    className="w-1.5 bg-white rounded-full"
                                />
                            ))}
                        </div>
                    ) : (
                        <Mic className={cn("w-10 h-10 transition-colors", isListening ? "text-white animate-pulse" : "text-slate-800")} />
                    )}
                </button>
                <div className="flex flex-col items-center mt-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {isListening ? t("listening...") : isSpeaking ? t("speaking...") : t("Tap to talk")}
                    </p>
                    {aiResponse && (
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => { setAiResponse(""); setTranscript(""); }}>
                            {t("Start Over")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
