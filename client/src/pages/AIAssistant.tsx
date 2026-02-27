import { MobileLayout } from "@/components/layout/MobileLayout";
import { Mic, Image as ImageIcon, Send, Sparkles, User, Activity, AlertTriangle, ShieldCheck, ArrowLeft, Trash2, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { findOfflineMedicalMatch } from "@/lib/offlineMedicalDictionary";
import { Link } from "wouter";

interface Message {
  role: "user" | "assistant";
  text: string;
  triage?: "RED" | "YELLOW" | "GREEN";
}

export default function AIAssistant() {
  const { t } = useStrictTranslation();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: t("Hi! I'm Asklepios, your AI health assistant. How are you feeling today?") }
  ]);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("healthify_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) { }
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem("healthify_chat_history", JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const clearHistory = () => {
    setMessages([{ role: "assistant", text: t("Hi! I'm Asklepios, your AI health assistant. How are you feeling today?") }]);
    localStorage.removeItem("healthify_chat_history");
    setShowMenu(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    // 1. Offline Deterministic Check first
    const offlineMatch = findOfflineMedicalMatch(text);

    // 2. Simulated AI delay or real API call
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();

      const assistantMsg: Message = {
        role: "assistant",
        text: data.reply,
        triage: offlineMatch?.triageLevel
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      // Fallback to offline data if network fails
      if (offlineMatch) {
        setMessages(prev => [...prev, {
          role: "assistant",
          text: `${t("I'm currently offline, but here's what I know about")} ${offlineMatch.condition}: ${offlineMatch.precautions.join(", ")}. ${offlineMatch.whenToSeeDoctor}`,
          triage: offlineMatch.triageLevel
        }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", text: t("I'm having trouble connecting. Please check your internet.") }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    t("Fever"), t("Chest Pain"), t("Snake Bite"), t("Cold")
  ];

  return (
    <MobileLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">

        {/* Premium Header Area (Sticky & Glassmorphic) */}
        <div className="sticky top-0 z-50 pt-2 pb-4 mb-2 bg-gradient-to-b from-slate-50 to-slate-50/0 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <Link href="/">
              <a className="p-2.5 bg-white/80 hover:bg-slate-100 rounded-[18px] border border-slate-200/60 shadow-sm transition-all text-slate-700">
                <ArrowLeft className="w-5 h-5" />
              </a>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 p-[2px] shadow-lg shadow-indigo-200">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-indigo-900 tracking-tight">{t("Asklepios AI")}</h1>
                <p className="text-[9px] uppercase tracking-widest font-black text-emerald-600/90 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> {t("Verified Medical AI")}
                </p>
              </div>
            </div>
          </div>

          {/* Menu options */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 bg-white/80 hover:bg-slate-100 rounded-[18px] border border-slate-200/60 shadow-sm transition-all text-slate-700"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-[20px] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={clearHistory}
                  className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("Clear History")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto mb-4 space-y-5 px-1 pb-4 scrollbar-none scroll-smooth">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-[24px] p-4 text-[15px] relative group leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-slate-800 text-white ml-auto rounded-tr-[6px]"
                  : "bg-white border border-slate-200/60 text-slate-700 rounded-tl-[6px]"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                    <Sparkles className="h-3.5 w-3.5" /> {t("Asklepios")}
                  </div>
                  {msg.triage && (
                    <div className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border",
                      msg.triage === "RED" ? "bg-red-50 text-red-700 border-red-200" :
                        msg.triage === "YELLOW" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      {msg.triage} {t("Priority")}
                    </div>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap font-medium">
                {msg.text}
              </div>

              {msg.triage === "RED" && (
                <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 shadow-inner">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-800 leading-relaxed">
                    {t("CRITICAL SAFETY ALERT: This condition requires immediate medical attention. Please visit the nearest emergency room or call 108/112.")}
                  </p>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="bg-white border border-slate-200/60 rounded-[24px] rounded-tl-[6px] p-5 w-fit shadow-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        {!loading && messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x shrink-0 px-1">
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="snap-start shrink-0 bg-white border border-slate-200/80 px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
              >
                {t(q)}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="relative shrink-0 pb-4 pt-2 z-50 bg-slate-50">
          <div className="bg-white border-2 border-slate-200/60 rounded-[32px] p-2 flex items-center gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:border-indigo-500 focus-within:shadow-indigo-100 transition-all duration-300">
            <button
              className="p-3.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-[24px]"
              aria-label={t("Upload Image for Analysis")}
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(query)}
              className="flex-1 border-none shadow-none focus-visible:ring-0 px-2 bg-transparent text-[15px] font-medium placeholder:text-slate-400"
              placeholder={t("Tell me your symptoms...")}
              aria-label={t("Message Asklepios AI")}
            />
            {query.length > 0 ? (
              <button
                onClick={() => sendMessage(query)}
                className="p-3.5 bg-slate-900 text-white rounded-[24px] hover:scale-105 active:scale-95 transition-all shadow-lg"
                aria-label={t("Send Message")}
              >
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </button>
            ) : (
              <button
                className="p-3.5 bg-slate-100 text-slate-600 rounded-[24px] hover:bg-slate-200 hover:text-slate-900 transition-all"
                aria-label={t("Voice Search")}
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </MobileLayout>
  );
}