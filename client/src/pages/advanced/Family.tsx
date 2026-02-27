import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Plus, Trash2, ShieldCheck, Activity, Dna, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface FamilyMember {
    id: string;
    relation: string;
    conditions: string[];
}

export default function Family() {
    const { t } = useStrictTranslation();
    const [tree, setTree] = useState<FamilyMember[]>([]);
    const [risks, setRisks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form inputs
    const [relation, setRelation] = useState("Parent");
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

    const conditionOptions = [
        t("Type 2 Diabetes"),
        t("Heart Disease"),
        t("Breast Cancer"),
        t("High Blood Pressure"),
        t("Asthma"),
        t("Alzheimer's"),
        t("Sickle Cell Anemia"),
        t("Cystic Fibrosis"),
        t("Huntington's Disease"),
        t("Colorectal Cancer"),
        t("Parkinson's Disease"),
        t("Lynch Syndrome"),
        t("Hemophilia"),
        t("Polycystic Kidney Disease")
    ];
    const relationOptions = [t("Parent"), t("Grandparent"), t("Sibling"), t("Uncle"), t("Aunt"), t("Cousin"), t("Child")];

    const addMember = () => {
        if (selectedConditions.length === 0) return;
        const newMember = {
            id: Date.now().toString(),
            relation,
            conditions: [...selectedConditions]
        };
        const newTree = [...tree, newMember];
        setTree(newTree);
        setSelectedConditions([]);
        calculateRisks(newTree);
    };

    const removeMember = (id: string) => {
        const newTree = tree.filter(m => m.id !== id);
        setTree(newTree);
        calculateRisks(newTree);
    };

    const [roadmap, setRoadmap] = useState("");
    const [nextStep, setNextStep] = useState("");
    const [recommendation, setRecommendation] = useState("");

    const calculateRisks = async (currentTree: FamilyMember[]) => {
        if (currentTree.length === 0) {
            setRisks([]);
            setRoadmap("");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/advanced/family", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tree: currentTree })
            });
            const data = await res.json();
            setRisks(data.risks || []);
            setRoadmap(data.roadmap || "");
            setNextStep(data.nextStep || "");
            setRecommendation(data.recommendation || "");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const riskColor = {
        "High": "bg-rose-50 border-rose-100 text-rose-600",
        "Moderate": "bg-amber-50 border-amber-100 text-amber-600",
        "Low": "bg-emerald-50 border-emerald-100 text-emerald-600",
    };

    const riskBadge = {
        "High": "bg-rose-500 shadow-sm",
        "Moderate": "bg-amber-500 shadow-sm",
        "Low": "bg-emerald-500 shadow-sm",
    };

    return (
        <MobileLayout>
            <div className="absolute inset-0 bg-slate-50 z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/60 blur-[100px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-100/60 blur-[100px] rounded-full mix-blend-multiply" />
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
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{t("Family Health")}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                            {t("Genetic Risks")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                {/* Visualizer & Risk Results (7/12 for web) */}
                <div className="lg:col-span-7 space-y-8">
                    <div>
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wider text-[10px] opacity-60">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            {t("Genetic Risk Assessment")}
                        </h3>

                        {tree.length === 0 && (
                            <div className="bg-white/80 border border-indigo-100 rounded-[32px] p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-md relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-inner">
                                    <Dna className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 mb-2">{t("Your Genetic Roadmap Starts Here")}</h4>
                                <p className="text-sm font-medium tracking-wide text-slate-500 leading-relaxed max-w-[300px] mx-auto uppercase text-[10px] tracking-widest">
                                    {t("Add family members and their conditions to see your possible genetic risks.")}
                                </p>
                            </div>
                        )}

                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center bg-white/40 rounded-[32px] border border-white/60">
                                <div className="w-16 h-16 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-sm flex items-center justify-center">
                                    <Dna className="w-6 h-6 absolute animate-pulse text-indigo-500" />
                                </div>
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-600 animate-pulse">{t("Decoding DNA Patterns...")}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <AnimatePresence>
                                    {risks.map((risk, i) => (
                                        <motion.div
                                            key={risk.condition} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                            className={cn("rounded-[28px] p-6 border transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 bg-white/80 backdrop-blur-md",
                                                risk.tier === "High" ? "border-rose-100 hover:border-rose-300" :
                                                    risk.tier === "Moderate" ? "border-amber-100 hover:border-amber-300" : "border-emerald-100 hover:border-emerald-300"
                                            )}
                                        >
                                            <div>
                                                <div className="flex justify-between items-center mb-6">
                                                    <p className="font-black text-xs uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">{t(risk.condition)}</p>
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full",
                                                        risk.tier === "High" ? "bg-rose-50 text-rose-600" :
                                                            risk.tier === "Moderate" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                                    )}>{t(risk.tier)}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-3xl font-black text-slate-800 tracking-tighter">{risk.riskPercentage}%</span>
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }} animate={{ width: `${risk.riskPercentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
                                                            className={cn("h-full rounded-full shadow-sm", riskBadge[risk.tier as keyof typeof riskBadge])}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{t("Susceptibility Score")}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Genetic Insights Card (Fills space) */}
                    {risks.length > 0 && !loading && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[60px] rounded-full -mr-20 -mt-20" />
                            <div className="relative z-10">
                                <ShieldCheck className="w-10 h-10 text-indigo-400 mb-6" />
                                <h4 className="text-xl font-bold mb-3">{t("Preventive Action Plan")}</h4>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium mb-6">
                                    {t(roadmap)}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <p className="text-[10px] uppercase font-black text-indigo-300 mb-1">{t("Next Step")}</p>
                                        <p className="text-xs font-bold">{t(nextStep)}</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <p className="text-[10px] uppercase font-black text-emerald-300 mb-1">{t("Recommendation")}</p>
                                        <p className="text-xs font-bold">{t(recommendation)}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Adding Tool (5/12 for web) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-fit">
                        <h3 className="font-black text-slate-800 mb-8 uppercase tracking-[0.2em] text-[10px] opacity-60 flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-indigo-600" />
                            {t("Add Relative")}
                        </h3>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t("Relation")}</label>
                                    <div className="relative">
                                        <select
                                            value={relation} onChange={e => setRelation(e.target.value)}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 appearance-none shadow-sm transition-all"
                                        >
                                            {relationOptions.map(o => <option key={o} value={o}>{t(o)}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex-1 flex items-end">
                                    <button
                                        onClick={addMember}
                                        disabled={selectedConditions.length === 0}
                                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 shadow-sm group"
                                    >
                                        <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" /> {t("Add To Log")}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t("Select Conditions")}</label>
                                <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                    {conditionOptions.map(cond => {
                                        const isSelected = selectedConditions.includes(cond);
                                        return (
                                            <button
                                                key={cond}
                                                onClick={() => {
                                                    if (isSelected) setSelectedConditions(p => p.filter(c => c !== cond));
                                                    else setSelectedConditions(p => [...p, cond]);
                                                }}
                                                className={cn(
                                                    "px-3 py-2 rounded-lg text-[10px] font-bold transition-all border text-left flex items-center justify-between",
                                                    isSelected
                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                        : "bg-white border-slate-100 text-slate-500"
                                                )}
                                            >
                                                <span className="truncate mr-1">{t(cond)}</span>
                                                {isSelected && <ShieldCheck className="w-3 h-3 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Current Tree List - Optimized for 'filled' look */}
                        {tree.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t("History Log")}</h4>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{tree.length} {t("Members")}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {tree.map(m => (
                                        <div key={m.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                                    <p className="text-[11px] font-black text-slate-800 tracking-wider uppercase">{t(m.relation)}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {m.conditions.map(c => (
                                                        <span key={c} className="text-[9px] font-bold py-1 px-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 truncate max-w-[120px]">{t(c)}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={() => removeMember(m.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors ml-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
}
