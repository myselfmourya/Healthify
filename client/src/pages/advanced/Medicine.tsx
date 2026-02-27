import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Search, ShieldAlert, CircleDollarSign, CheckCircle2, ShieldCheck, AlertTriangle, ArrowLeft, CalendarCheck2, Flame, BellRing, Clock, Plus, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Medicine() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<"check" | "adherence">("adherence");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [meds, setMeds] = useState<{ id: string; name: string; dose: string; time: string; taken: boolean; streak: number }[]>(() => {
        const saved = localStorage.getItem("healthify_meds");
        return saved ? JSON.parse(saved) : [
            { id: "1", name: "Metformin", dose: "500mg", time: "08:00 AM", taken: true, streak: 12 },
            { id: "2", name: "Atorvastatin", dose: "20mg", time: "08:00 PM", taken: false, streak: 5 },
        ];
    });

    const [isAdding, setIsAdding] = useState(false);
    const [editingMedId, setEditingMedId] = useState<string | null>(null);
    const [newMed, setNewMed] = useState({ name: "", dose: "", time: "08:00 AM" });

    useEffect(() => {
        localStorage.setItem("healthify_meds", JSON.stringify(meds));
    }, [meds]);

    const toggleTaken = (id: string) => {
        setMeds(prev => prev.map(m => {
            if (m.id === id) {
                return { ...m, taken: !m.taken, streak: !m.taken ? m.streak + 1 : Math.max(0, m.streak - 1) };
            }
            return m;
        }));
    };

    const handleAddOrEdit = () => {
        if (!newMed.name || !newMed.dose) return;
        if (editingMedId) {
            setMeds(prev => prev.map(m => m.id === editingMedId ? { ...m, ...newMed } : m));
            setEditingMedId(null);
        } else {
            const med = { ...newMed, id: Date.now().toString(), taken: false, streak: 0 };
            setMeds(prev => [...prev, med]);
        }
        setNewMed({ name: "", dose: "", time: "08:00 AM" });
        setIsAdding(false);
    };

    const deleteMed = (id: string) => {
        setMeds(prev => prev.filter(m => m.id !== id));
    };

    const startEdit = (med: any) => {
        setNewMed({ name: med.name, dose: med.dose, time: med.time });
        setEditingMedId(med.id);
        setIsAdding(true);
    };

    const [selectedMedForCheck, setSelectedMedForCheck] = useState<any>(null);

    const searchMedicines = async (q: string) => {
        if (!q.trim()) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const res = await fetch(`/api/medicines?search=${q}`);
            const data = await res.json();
            if (!res.ok || data.error || data.success === false) {
                setSearchResults([]);
                return;
            }
            const arr = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
            setSearchResults(arr);
        } catch (err) {
            console.error(err);
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === "check") searchMedicines(query);
        }, 500);
        return () => clearTimeout(timer);
    }, [query, activeTab]);

    const checkMedicine = async (medName?: string) => {
        const target = medName || query;
        if (!target.trim()) return;
        setLoading(true);
        try {
            const res = await fetch("/api/advanced/medicine/risk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medicineName: target,
                    profile: {
                        allergies: user.allergies || [],
                        conditions: user.diseases || []
                    }
                })
            });
            const data = await res.json();
            setResult(data);
            setSelectedMedForCheck(target);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout>
            <div className="absolute inset-0 bg-slate-50 z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-100/60 blur-[100px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-100/60 blur-[100px] rounded-full mix-blend-multiply" />
            </div>

            <div className="mb-6 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <a className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </a>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight text-slate-800 flex items-center gap-2">
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">{t("PharmaLens")}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                            {t("Medication Intelligence")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex p-1 bg-white/60 backdrop-blur-md rounded-2xl mb-6 shadow-sm border border-white">
                <button
                    onClick={() => setActiveTab("adherence")}
                    className={cn("flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                        activeTab === "adherence" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                    <CalendarCheck2 className="w-4 h-4" /> {t("My Adherence")}
                </button>
                <button
                    onClick={() => setActiveTab("check")}
                    className={cn("flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                        activeTab === "check" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                    <Search className="w-4 h-4" /> {t("Search & Check")}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "adherence" ? (
                    <motion.div key="adherence" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6 pb-20">
                        {/* Overall Streak Card */}
                        <div className="bg-gradient-to-br from-cyan-600 to-teal-600 rounded-[32px] p-6 text-white shadow-[0_8px_30px_rgba(6,182,212,0.3)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Flame className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                    <Flame className="w-8 h-8 text-amber-300 fill-amber-300" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-100">{t("Current Streak")}</p>
                                    <h2 className="text-4xl font-black mt-1">{meds.reduce((acc, curr) => Math.max(acc, curr.streak), 0)} <span className="text-lg font-medium text-cyan-100">Days</span></h2>
                                </div>
                            </div>
                            <p className="mt-4 text-sm font-medium text-teal-50 leading-relaxed max-w-[250px]">
                                {t("You are doing great! Taking your meds consistently prevents 90% of complications.")}
                            </p>
                        </div>

                        {/* Today's Schedule */}
                        <div>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("Today's Schedule")}</h3>
                                </div>
                                <button
                                    onClick={() => { setIsAdding(true); setEditingMedId(null); setNewMed({ name: "", dose: "", time: "08:00 AM" }); }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-full border border-cyan-100 shadow-sm flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" /> {t("Add Med")}
                                </button>
                            </div>

                            {isAdding && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/90 backdrop-blur-xl rounded-[24px] p-6 border border-cyan-100 shadow-xl mb-6">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4">{editingMedId ? t("Edit Medicine") : t("Add Medicine")}</h4>
                                    <div className="space-y-4">
                                        <input
                                            type="text" placeholder={t("Medicine Name")} value={newMed.name}
                                            onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
                                        />
                                        <input
                                            type="text" placeholder={t("Dose (e.g. 500mg)")} value={newMed.dose}
                                            onChange={e => setNewMed(p => ({ ...p, dose: e.target.value }))}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
                                        />
                                        <input
                                            type="time" value={newMed.time}
                                            onChange={e => setNewMed(p => ({ ...p, time: e.target.value }))}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
                                        />
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setIsAdding(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">{t("Cancel")}</button>
                                            <button onClick={handleAddOrEdit} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 text-white uppercase tracking-wider shadow-lg shadow-cyan-200">{t("Save")}</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="space-y-3">
                                {meds.map(med => (
                                    <div key={med.id} className="bg-white/80 backdrop-blur-xl rounded-[24px] p-5 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 group">
                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0",
                                            med.taken ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                            <Pill className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900 text-[15px] truncate">{med.name}</h4>
                                                <div className="hidden group-hover:flex items-center gap-2">
                                                    <button onClick={() => startEdit(med)} className="p-1 text-slate-400 hover:text-cyan-600"><Settings className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => deleteMed(med.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{med.dose} • {med.time}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleTaken(med.id)}
                                            className={cn("px-4 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider shrink-0",
                                                med.taken ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-900 text-white shadow-md hover:bg-slate-800"
                                            )}>
                                            {med.taken ? t("Taken") : t("Take Now")}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="check" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        {/* Search / Input */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-fit">
                            <h2 className="font-bold text-slate-800 mb-6 tracking-wider uppercase text-xs">{t("Check a Medicine")}</h2>

                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Search className="w-5 h-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t("Enter medicine name...")}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && checkMedicine()}
                                    className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-[20px] text-sm text-slate-800 font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm placeholder-slate-400"
                                />
                            </div>

                            <button
                                onClick={() => checkMedicine()}
                                disabled={loading || !query}
                                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 disabled:grayscale text-white rounded-[20px] font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(6,182,212,0.3)]"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("Check Safety")}
                            </button>

                            <div className="mt-8 p-5 bg-amber-50 rounded-[20px] border border-amber-100">
                                <p className="text-xs text-amber-700 font-medium leading-relaxed flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
                                    {t("This tool checks against your profile (Allergies: " + (user.allergies?.length ? user.allergies.join(", ") : "None") + ", Conditions: " + (user.diseases?.length ? user.diseases.join(", ") : "None") + ").")}
                                </p>
                            </div>
                        </div>

                        {/* Results View */}
                        <div className="h-full min-h-[400px]">
                            {!result && !loading && (
                                <div className="bg-white/80 border border-white rounded-[32px] p-8 text-center h-full flex flex-col items-center justify-center backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                    <div className="w-20 h-20 rounded-full bg-cyan-50 flex items-center justify-center mb-6 border border-cyan-100 shadow-sm">
                                        <Pill className="w-10 h-10 text-cyan-500" />
                                    </div>
                                    <h3 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-3">{t("Ready to Check")}</h3>
                                    <p className="text-sm font-medium text-slate-600 max-w-[250px] mx-auto leading-relaxed text-center">
                                        {t("Enter a medicine name to check for side effects, allergies, and cheaper alternatives.")}
                                    </p>
                                </div>
                            )}

                            {loading && (
                                <div className="bg-white/80 rounded-[32px] p-8 border border-white text-center h-full flex flex-col items-center justify-center backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                    <div className="w-16 h-16 border-[3px] border-cyan-100 border-t-cyan-500 rounded-full animate-spin mb-6 text-cyan-500 shadow-sm flex items-center justify-center">
                                        <Search className="w-5 h-5 absolute animate-pulse" />
                                    </div>
                                    <p className="text-xs font-bold tracking-widest uppercase text-cyan-600 animate-pulse">{t("AI is searching...")}</p>
                                </div>
                            )}

                            {!result && !loading && searchResults.length > 0 && (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">{t("Search Results")}</h3>
                                    {searchResults.map((med, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => checkMedicine(med.name)}
                                            className="w-full bg-white/60 hover:bg-white border border-white p-4 rounded-2xl flex items-center justify-between text-left transition-all shadow-sm group"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm group-hover:text-cyan-600 transition-colors">{med.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-1">{med.dose} • {med.type}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {result && !loading && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        {/* Risk Status Card */}
                                        <div className={cn(
                                            "rounded-[32px] p-6 border backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden",
                                            result.status === "SAFE" ? "bg-white border-emerald-200" :
                                                result.status === "WARNING" ? "bg-white border-amber-200" :
                                                    "bg-white border-rose-200"
                                        )}>
                                            <div className="absolute inset-0 opacity-10 pointer-events-none"
                                                style={{ backgroundColor: result.status === "SAFE" ? "#10b981" : result.status === "WARNING" ? "#f59e0b" : "#f43f5e" }} />

                                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm",
                                                    result.status === "SAFE" ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
                                                        "bg-rose-50 border-rose-100 text-rose-500"
                                                )}>
                                                    {result.status === "SAFE" ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black capitalize tracking-tight text-slate-800">
                                                        {query}
                                                    </h3>
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase tracking-widest mt-1 block",
                                                        result.status === "SAFE" ? "text-emerald-600" :
                                                            result.status === "WARNING" ? "text-amber-600" :
                                                                "text-rose-600"
                                                    )}>
                                                        {t("Safety: ")} {t(result.status)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="relative z-10 bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm mt-6">
                                                {result.warnings.length > 0 ? (
                                                    <ul className="space-y-3">
                                                        {result.warnings.map((w: string, i: number) => (
                                                            <li key={i} className="flex gap-3 text-sm font-medium text-slate-700 leading-relaxed">
                                                                <span className={cn(
                                                                    "w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm",
                                                                    result.status === "CRITICAL" ? "bg-rose-500" : "bg-amber-500"
                                                                )} />
                                                                {t(w)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm font-medium text-emerald-600 flex items-center gap-3">
                                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                                        {t("Generally safe based on your profile.")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Affordability / Generics Card */}
                                        <div className="bg-white/80 rounded-[32px] p-6 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-wider text-xs">
                                                <CircleDollarSign className="w-5 h-5 text-cyan-600" />
                                                {t("Cheaper Alternatives")}
                                            </h3>

                                            {result.alternatives && result.alternatives.length > 0 ? (
                                                <div className="space-y-4">
                                                    <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">{t("Same active ingredients, lower cost:")}</p>
                                                    {result.alternatives.map((alt: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
                                                            <div>
                                                                <p className="font-bold tracking-tight text-slate-800 text-sm">{alt.name}</p>
                                                                <p className="text-[10px] text-cyan-600 uppercase font-bold tracking-widest mt-1">{t("Cost")}: {alt.estimatedCost}</p>
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-full border border-cyan-100 shadow-sm">
                                                                {t("Generic")}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center p-6 bg-slate-50 rounded-[20px] border border-slate-100">
                                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                                        {t("No generic alternatives found in our database.")}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MobileLayout>
    );
}

