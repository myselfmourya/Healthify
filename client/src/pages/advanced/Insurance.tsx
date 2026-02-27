import { useState, useEffect, useMemo } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, IndianRupee, BriefcaseMedical, Search, Percent, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface InsuranceScheme {
    id: string;
    name: string;
    type: string;
    eligibility: string[];
    benefit: string;
    coverage: string;
    premium: string;
    rating: number;
}

export default function Insurance() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [schemes, setSchemes] = useState<InsuranceScheme[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [typeFilter, setTypeFilter] = useState<"All" | "Government" | "Private">("All");
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
    const [viewingPlan, setViewingPlan] = useState<InsuranceScheme | null>(null);
    const [showCompare, setShowCompare] = useState(false);

    useEffect(() => {
        const fetchInsurance = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/insurance?type=${typeFilter}&search=${searchQuery}`);
                const data = await res.json();
                if (!res.ok || data.error || data.success === false) {
                    setSchemes([]);
                    return;
                }
                const arr = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setSchemes(arr);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchInsurance, searchQuery ? 500 : 0);
        return () => clearTimeout(timer);
    }, [typeFilter, searchQuery]);

    const filteredSchemes = schemes;

    const togglePlanSelection = (id: string) => {
        setSelectedPlans(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
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
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">{t("Coverage")}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                            {t("Insurance & Plans")}
                        </p>
                    </div>
                </div>
                {selectedPlans.length >= 2 && (
                    <button
                        onClick={() => setShowCompare(true)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 animate-bounce"
                    >
                        {t("Compare")} ({selectedPlans.length})
                    </button>
                )}
            </div>

            {/* User Profile Context Hint */}
            <div className="bg-emerald-50 rounded-[24px] p-5 border border-emerald-100 flex items-start gap-4 shadow-sm mb-8">
                <BriefcaseMedical className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-emerald-900 font-bold text-sm mb-1">{t("Profile Matches")}</h3>
                    <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                        {t("Filtering automatically for Age:")} <span className="text-emerald-600 font-bold">{user.age || 30}</span>, {t("Conditions:")} <span className="text-emerald-600 font-bold">{user.diseases?.length || 0}</span>.
                    </p>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col gap-4 mb-8 relative z-20">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={t("Search health plans...")}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-[20px] text-sm text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-slate-400 shadow-sm"
                    />
                </div>

                <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-[20px] border border-slate-200">
                    {["All", "Government", "Private"].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type as any)}
                            className={cn(
                                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-[16px] transition-all",
                                typeFilter === type
                                    ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                                    : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"
                            )}
                        >
                            {t(type)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-[3px] border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-6 text-emerald-500 shadow-sm flex items-center justify-center">
                        <Shield className="w-6 h-6 absolute animate-pulse" />
                    </div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">{t("Finding Plans...")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredSchemes.length === 0 ? (
                        <div className="text-center py-16 bg-white/80 rounded-[32px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                            <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-slate-800 font-bold tracking-widest uppercase text-sm mb-2">{t("No Matches Found")}</h3>
                            <p className="text-xs text-slate-500">{t("Try changing your search or filters.")}</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredSchemes.map((scheme, i) => {
                                const isSelected = selectedPlans.includes(String(scheme.id));
                                return (
                                    <motion.div
                                        key={scheme.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={cn(
                                            "bg-white/80 rounded-[32px] p-6 border transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col backdrop-blur-xl relative overflow-hidden",
                                            isSelected ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-white"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none mix-blend-overlay" />

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex gap-3 items-start">
                                                <button
                                                    onClick={() => togglePlanSelection(String(scheme.id))}
                                                    className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-1",
                                                        isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-200"
                                                    )}
                                                >
                                                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                </button>
                                                <h3 className="font-bold text-[16px] tracking-tight text-slate-800 leading-tight pr-4">{t(scheme.name)}</h3>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-center">
                                                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1 flex items-center gap-1.5">
                                                    <Shield className="w-3 h-3 text-emerald-500" /> {t("Coverage")}
                                                </p>
                                                <p className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">{t(scheme.coverage)}</p>
                                            </div>
                                            <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-center">
                                                <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1 flex items-center gap-1.5">
                                                    <IndianRupee className="w-3 h-3 text-cyan-500" /> {t("Premium")}
                                                </p>
                                                <p className="font-bold text-sm text-slate-800">{t(scheme.premium)}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6 flex-1 relative z-10">
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3">
                                                {t(scheme.benefit)}
                                            </p>
                                        </div>

                                        <div className="mt-auto relative z-10 flex items-center justify-between">
                                            <span className={cn(
                                                "text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full shrink-0 border shadow-sm",
                                                scheme.type === "Government" ? "bg-cyan-50 text-cyan-600 border-cyan-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}>
                                                {t(scheme.type)}
                                            </span>
                                            <button
                                                onClick={() => setViewingPlan(scheme)}
                                                className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 shadow-sm"
                                            >
                                                {t("Details")} <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            )}

            {/* Details Modal */}
            <AnimatePresence>
                {viewingPlan && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[32px] p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
                            <h2 className="text-2xl font-black text-slate-800 mb-6">{t(viewingPlan.name)}</h2>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{t("Core Benefit")}</h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">{t(viewingPlan.benefit)}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{t("Eligibility Criteria")}</h4>
                                    <ul className="space-y-3">
                                        {(Array.isArray(viewingPlan.eligibility) ? viewingPlan.eligibility : [viewingPlan.eligibility]).map((req, idx) => (
                                            <li key={idx} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-700">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                {t(req)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <button onClick={() => setViewingPlan(null)} className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg">{t("Close")}</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Comparison Modal */}
            <AnimatePresence>
                {showCompare && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-2xl rounded-[32px] p-8 max-h-[90vh] overflow-x-auto relative shadow-2xl">
                            <h2 className="text-2xl font-black text-slate-800 mb-8">{t("Plan Comparison")}</h2>
                            <div className="min-w-[600px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-4 text-[10px] font-bold uppercase text-slate-400">{t("Feature")}</th>
                                            {selectedPlans.map(id => {
                                                const p = schemes.find(s => String(s.id) === id);
                                                return p ? <th key={id} className="py-4 px-4 text-sm font-bold text-emerald-600 text-center">{t(p.name)}</th> : null;
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="py-6 text-sm font-bold text-slate-500">{t("Coverage Limit")}</td>
                                            {selectedPlans.map(id => {
                                                const p = schemes.find(s => String(s.id) === id);
                                                return <td key={id} className="py-6 px-4 text-center font-black text-slate-800">{p?.coverage}</td>;
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="py-6 text-sm font-bold text-slate-500">{t("Annual Premium")}</td>
                                            {selectedPlans.map(id => {
                                                const p = schemes.find(s => String(s.id) === id);
                                                return <td key={id} className="py-6 px-4 text-center font-bold text-emerald-600 bg-emerald-50/50 rounded-xl m-2">{p?.premium}</td>;
                                            })}
                                        </tr>
                                        <tr>
                                            <td className="py-6 text-sm font-bold text-slate-500">{t("Eligibility")}</td>
                                            {selectedPlans.map(id => {
                                                const p = schemes.find(s => String(s.id) === id);
                                                const eligStr = Array.isArray(p?.eligibility) ? p?.eligibility.join(", ") : p?.eligibility;
                                                return <td key={id} className="py-6 px-4 text-center text-xs text-slate-600 leading-relaxed">{eligStr}</td>;
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => setShowCompare(false)} className="w-full mt-10 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 md:w-max px-12 mx-auto block">{t("Back to Plans")}</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MobileLayout>
    );
}
