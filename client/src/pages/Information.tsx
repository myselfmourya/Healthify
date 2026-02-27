import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import {
    Newspaper, Pill, ShieldPlus, MapPin, Search, ChevronRight, ExternalLink, Phone, Star,
    RefreshCw, Navigation, AlertCircle, Globe, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";

// ─── News Tab ───────────────────────────────────────────────────────────────
function NewsTab() {
    const { languageCode, language, translateAsync, isTranslating } = useLanguage();
    const { t } = useStrictTranslation();
    const [translatedNews, setTranslatedNews] = useState<any[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);

    const { data: news = [], isLoading } = useQuery({
        queryKey: ["news"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/news");
                const json = await res.json();
                if (!res.ok || json.error || json.success === false) {
                    throw new Error(json.error || "Failed to fetch news");
                }
                const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                localStorage.setItem("healthify_news_cache", JSON.stringify(data));
                return data;
            } catch (err) {
                const cached = localStorage.getItem("healthify_news_cache");
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) { }
                }
                throw err;
            }
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        initialData: () => {
            const cached = localStorage.getItem("healthify_news_cache");
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) { }
            }
            return undefined;
        }
    });

    useEffect(() => {
        if (!news.length) return;
        if (languageCode === "en") { setTranslatedNews(news); return; }
        const translateAll = async () => {
            const translated = await Promise.all(
                news.map(async (article: any) => ({
                    ...article,
                    title: await translateAsync(article.title),
                    description: await translateAsync(article.description),
                }))
            );
            setTranslatedNews(translated);
        };
        translateAll();
    }, [news, languageCode]);

    const displayNews = translatedNews.length ? translatedNews : news;

    const CATEGORY_COLORS: Record<string, string> = {
        Policy: "bg-blue-100 text-blue-700",
        Insurance: "bg-green-100 text-green-700",
        Nutrition: "bg-orange-100 text-orange-700",
        Disease: "bg-red-100 text-red-700",
        Research: "bg-violet-100 text-violet-700",
        default: "bg-gray-100 text-gray-700",
    };

    return (
        <div>
            {(isLoading || (isTranslating && languageCode !== "en")) && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-2xl px-4 py-3 mb-4 text-blue-600 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    {isLoading ? t("Fetching health news with AI...") : `${t("Translating to")} ${language}...`}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayNews.map((article: any, i: number) => {
                    const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.default;
                    const isExpanded = expanded === `${i}`;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="glass rounded-2xl overflow-hidden flex flex-col h-full">
                            <div className="p-4 cursor-pointer flex-grow flex flex-col" onClick={() => setExpanded(isExpanded ? null : `${i}`)}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", catColor)}>
                                        {article.category}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 leading-snug mb-2 flex-grow">{article.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-3">{article.description}</p>
                            </div>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                                        className="overflow-hidden border-t border-gray-100 shrink-0">
                                        <div className="p-4 bg-gray-50/50">
                                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{article.content}</p>
                                            <div className="flex gap-2 mt-3">
                                                <a href={article.url} target="_blank" rel="noreferrer"
                                                    className="flex items-center justify-center w-full gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
                                                    <Globe className="w-3.5 h-3.5" /> {t("Read Full Article")}
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Medicines Tab ──────────────────────────────────────────────────────────
function MedicinesTab() {
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<number | null>(null);
    const { languageCode, language, translateAsync, isTranslating } = useLanguage();
    const { t } = useStrictTranslation();
    const [translatedMeds, setTranslatedMeds] = useState<any[]>([]);

    const { data: medicines = [], isLoading } = useQuery({
        queryKey: ["medicines", search],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/medicines?search=${encodeURIComponent(search)}`);
                const json = await res.json();
                if (!res.ok || json.error || json.success === false) {
                    throw new Error(json.error || "Failed to fetch medicines");
                }
                const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                if (!search) localStorage.setItem("healthify_meds_cache", JSON.stringify(data));
                return data;
            } catch (err) {
                if (!search) {
                    const cached = localStorage.getItem("healthify_meds_cache");
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            if (Array.isArray(parsed)) return parsed;
                        } catch (e) { }
                    }
                }
                throw err;
            }
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        initialData: () => {
            if (!search) {
                const cached = localStorage.getItem("healthify_meds_cache");
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) { }
                }
            }
            return undefined;
        }
    });

    useEffect(() => {
        if (!medicines.length) return;
        if (languageCode === "en") { setTranslatedMeds(medicines); return; }
        const translateAll = async () => {
            const translated = await Promise.all(
                medicines.map(async (m: any) => ({
                    ...m,
                    description: await translateAsync(m.description),
                    usage: await translateAsync(m.usage),
                }))
            );
            setTranslatedMeds(translated);
        };
        translateAll();
    }, [medicines, languageCode]);

    const displayMeds = translatedMeds.length ? translatedMeds : medicines;

    const FORM_COLORS: Record<string, string> = {
        Tablet: "bg-blue-50 text-blue-600",
        Capsule: "bg-violet-50 text-violet-600",
        Syrup: "bg-green-50 text-green-600",
        Injection: "bg-red-50 text-red-600",
        Solution: "bg-cyan-50 text-cyan-600",
        Powder: "bg-orange-50 text-orange-600",
    };

    return (
        <div>
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                    placeholder={t("Search by name, usage, category...")}
                    value={search} onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {(isLoading || (isTranslating && languageCode !== "en")) && (
                <div className="flex items-center gap-2 text-blue-600 text-xs mb-3">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {isLoading ? t("Loading medicines...") : `${t("Translating to")} ${language}...`}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayMeds.map((med: any) => {
                    const formColor = FORM_COLORS[med.form?.split(" / ")[0] || "Tablet"] || "bg-gray-50 text-gray-600";
                    return (
                        <div key={med.id} className="glass rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setExpanded(med.id)}>
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-gray-900 text-sm md:text-base">{med.name}</h4>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn("text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full", formColor)}>{t(med.form?.split(" / ")[0] || "Medicine")}</span>
                                        {med.prescription && <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{t("Rx")}</span>}
                                    </div>
                                </div>
                                <p className="text-[11px] sm:text-xs text-gray-500 mb-2 truncate">{med.genericName}</p>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{med.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4 font-bold text-sm">
                                <span className="text-green-700">{med.price}</span>
                                <span className="text-blue-600 text-[11px] sm:text-xs flex items-center gap-1">{t("View Details")} <ChevronRight className="w-3 h-3" /></span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Overlay for Medicine Details */}
            <AnimatePresence>
                {expanded !== null && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setExpanded(null)}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        {(() => {
                            const med = displayMeds.find((m: any) => m.id === expanded);
                            if (!med) return null;
                            const formColor = FORM_COLORS[med.form?.split(" / ")[0] || "Tablet"] || "bg-gray-50 text-gray-600";

                            return (
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                                >
                                    <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                {med.name}
                                                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", formColor)}>{med.form?.split(" / ")[0] || "Medicine"}</span>
                                            </h2>
                                            <p className="text-xs sm:text-sm text-gray-500">{med.genericName}</p>
                                        </div>
                                        <button onClick={() => setExpanded(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-green-50/50 rounded-2xl p-3 border border-green-100">
                                                <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">{t("Price")}</p>
                                                <p className="text-sm sm:text-base font-bold text-gray-900">{t(med.price)}</p>
                                            </div>
                                            <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100">
                                                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">{t("Form")}</p>
                                                <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{t(med.form || "N/A")}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1">{t("Description")}</h3>
                                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{med.description}</p>
                                        </div>

                                        <div className="space-y-3">
                                            {[
                                                { label: "Usage", value: med.usage, icon: "💡", color: "text-blue-900", bg: "bg-blue-50" },
                                                { label: "Dosage", value: med.dosage, icon: "⚖️", color: "text-amber-900", bg: "bg-amber-50" },
                                                { label: "Side Effects", value: med.sideEffects, icon: "⚠️", color: "text-red-900", bg: "bg-red-50" },
                                            ].map(({ label, value, icon, color, bg }) => (
                                                <div key={label} className={cn("rounded-2xl p-3 sm:p-4", bg)}>
                                                    <p className={cn("text-xs font-bold mb-1 flex items-center gap-1.5", color)}>
                                                        {icon} {t(label)}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{t(value)}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t("Common Brands")}</h3>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {med.brands?.map((b: string) => (
                                                    <span key={b} className="bg-gray-100 border border-gray-200 text-gray-700 text-[11px] sm:text-xs px-2.5 py-1 rounded-lg font-medium shadow-sm">{b}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {med.prescription && (
                                            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                <p className="font-medium">{t("Prescription strictly required. Do not self-medicate based on this information; always consult a certified doctor.")}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Insurance Tab ──────────────────────────────────────────────────────────
function InsuranceTab() {
    const [filter, setFilter] = useState("All");
    const [expanded, setExpanded] = useState<number | null>(null);
    const { languageCode, language, translateAsync, isTranslating } = useLanguage();
    const { t } = useStrictTranslation();
    const [translatedSchemes, setTranslatedSchemes] = useState<any[]>([]);

    const { data: schemes = [], isLoading } = useQuery({
        queryKey: ["insurance", filter],
        queryFn: async () => {
            const url = filter !== "All" ? `/api/insurance?type=${filter}` : "/api/insurance";
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok || data.error || data.success === false) return [];
            return Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    useEffect(() => {
        if (!schemes.length) return;
        if (languageCode === "en") { setTranslatedSchemes(schemes); return; }
        const translateAll = async () => {
            const translated = await Promise.all(
                schemes.map(async (s: any) => ({
                    ...s,
                    description: await translateAsync(s.description),
                    ruralExplanation: await translateAsync(s.ruralExplanation),
                }))
            );
            setTranslatedSchemes(translated);
        };
        translateAll();
    }, [schemes, languageCode]);

    const displaySchemes = translatedSchemes.length ? translatedSchemes : schemes;

    return (
        <div>
            <div className="flex gap-2 mb-4">
                {["All", "Government", "Private"].map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={cn("flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all",
                            filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500")}>
                        {t(f)}
                    </button>
                ))}
            </div>

            {(isLoading || (isTranslating && languageCode !== "en")) && (
                <div className="flex items-center gap-2 text-blue-600 text-xs mb-3">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {isLoading ? t("Loading schemes...") : `${t("Translating to")} ${language}...`}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displaySchemes.map((scheme: any) => {
                    const isOpen = expanded === scheme.id;
                    return (
                        <div key={scheme.id} className="glass rounded-2xl overflow-hidden">
                            <div className="p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : scheme.id)}>
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm leading-tight flex-1 mr-2">{scheme.name}</h4>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                                        scheme.type === "Government" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>
                                        {t(scheme.type)}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-green-700 mb-1">{scheme.coverage}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{scheme.description}</p>
                                {scheme.ruralExplanation && (
                                    <div className="mt-2 bg-amber-50 rounded-xl px-3 py-2">
                                        <p className="text-[11px] text-amber-800 leading-relaxed">💡 {scheme.ruralExplanation}</p>
                                    </div>
                                )}
                            </div>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                                        className="overflow-hidden border-t border-gray-100">
                                        <div className="p-4 space-y-3">
                                            <div>
                                                <p className="text-xs font-bold text-green-700 mb-1">✅ {t("Benefits")}</p>
                                                <ul className="space-y-1">
                                                    {scheme.benefits?.map((b: string, i: number) => (
                                                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0" />{b}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-blue-700 mb-1">📋 {t("Eligibility")}</p>
                                                <p className="text-xs text-gray-600">{scheme.eligibility}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-orange-600 mb-1">📄 {t("Required Documents")}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {scheme.requiredDocuments?.map((d: string) => (
                                                        <span key={d} className="bg-orange-50 text-orange-700 text-[10px] px-2 py-0.5 rounded-full">{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-700 mb-1">🪜 {t("How to Apply")}</p>
                                                <ol className="space-y-1">
                                                    {scheme.applicationSteps?.map((s: string, i: number) => (
                                                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                                            <span className="w-4 h-4 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <a href={scheme.officialWebsite} target="_blank" rel="noreferrer"
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
                                                    <ExternalLink className="w-3.5 h-3.5" /> {t("Official Website")}
                                                </a>
                                                <a href={`tel:${scheme.helpline}`}
                                                    className="flex items-center justify-center gap-1.5 px-4 py-3 bg-green-100 text-green-700 rounded-xl text-xs font-bold hover:bg-green-200">
                                                    <Phone className="w-3.5 h-3.5" /> {scheme.helpline}
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Hospital Locator Tab ────────────────────────────────────────────────────
function HospitalLocatorTab() {
    const { t } = useStrictTranslation();
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [located, setLocated] = useState(false);

    const findHospitals = async () => {
        setLoading(true); setError("");
        if (!navigator.geolocation) { setError(t("Geolocation not supported.")); setLoading(false); return; }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(`/api/hospitals/nearby?lat=${latitude}&lon=${longitude}&radius=15000`);
                    const data = await res.json();
                    if (!res.ok || data.error || data.success === false) { setHospitals([]); }
                    else { setHospitals(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])); }
                    setLocated(true);
                } catch { setError(t("Failed to fetch hospitals. Please try again.")); }
                setLoading(false);
            },
            () => { setError(t("Location permission denied. Please enable location access.")); setLoading(false); }
        );
    };

    return (
        <div>
            {!located && (
                <div className="text-center py-6 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{t("Find Nearby Hospitals")}</h3>
                    <p className="text-sm text-gray-500 mb-4">{t("We'll use your GPS location to find hospitals within 15km")}</p>
                    <button onClick={findHospitals} disabled={loading}
                        className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm flex items-center gap-2 mx-auto hover:bg-blue-700 transition-colors">
                        {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> {t("Locating...")}</> : <><Navigation className="w-4 h-4" /> {t("Find Hospitals")}</>}
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
            )}

            {located && (
                <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-gray-900">{t("Nearby Hospitals")} ({hospitals.length})</p>
                    <button onClick={findHospitals} className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> {t("Refresh")}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hospitals.map((h: any, i: number) => (
                    <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 mr-3">
                                <h4 className="font-bold text-gray-900 text-sm">{h.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{h.address}</p>
                            </div>
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-xl shrink-0">
                                {h.distance} km
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`}
                                target="_blank" rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">
                                <Navigation className="w-3.5 h-3.5" /> {t("Directions")}
                            </a>
                            {h.phone && (
                                <a href={`tel:${h.phone}`}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-100 text-green-700 rounded-xl text-xs font-bold hover:bg-green-200">
                                    <Phone className="w-3.5 h-3.5" /> {t("Call")}
                                </a>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Information Page ───────────────────────────────────────────────────
export default function Information() {
    const { t } = useStrictTranslation();
    const TABS = [
        { id: "news", label: t("News"), icon: Newspaper },
        { id: "medicines", label: t("Medicines"), icon: Pill },
        { id: "insurance", label: t("Insurance"), icon: ShieldPlus },
        { id: "hospitals", label: t("Hospitals"), icon: MapPin },
    ];
    const [activeTab, setActiveTab] = useState("news");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab");
        if (tabParam && TABS.find(tab => tab.id === tabParam)) setActiveTab(tabParam);
    }, []);

    return (
        <MobileLayout>
            <div className="animate-in fade-in duration-500">
                <div className="mb-5 pt-2">
                    <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{t("Information Hub")}</h2>
                    <h1 className="text-2xl font-bold text-gray-900">{t("Health")} <span className="text-blue-600">{t("News Headlines")}</span></h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-5">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0",
                                activeTab === id ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                            <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                        {activeTab === "news" && <NewsTab />}
                        {activeTab === "medicines" && <MedicinesTab />}
                        {activeTab === "insurance" && <InsuranceTab />}
                        {activeTab === "hospitals" && <HospitalLocatorTab />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
}
