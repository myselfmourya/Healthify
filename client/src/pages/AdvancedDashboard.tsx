import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import {
    Activity, ShieldAlert, Brain, HeartPulse, Pill, UserPlus, Zap, BookOpen, ShieldCheck, Fingerprint, Lightbulb
} from "lucide-react";

export default function AdvancedDashboard() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [healthTip, setHealthTip] = useState("Stay hydrated — drink at least 8 glasses of water daily!");

    useEffect(() => {
        fetch("/api/health-tips").then(r => r.json()).then(d => setHealthTip(d.tip)).catch(() => { });
    }, []);

    return (
        <MobileLayout>
            <div className="absolute inset-0 bg-slate-50 z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-100/60 blur-[100px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-100/60 blur-[100px] rounded-full mix-blend-multiply" />
                <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-100/50 blur-[80px] rounded-full mix-blend-multiply" />
            </div>

            {/* Premium Header */}
            <div className="mb-8 pt-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-4 px-2"
                >
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight text-slate-800 flex items-center gap-2 mb-1">
                            {t("Welcome,")} <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">{user.name.split(' ')[0]}</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium tracking-wide flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-emerald-500" /> {t("Ready to assist")}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white p-[1px] shrink-0 border border-emerald-100 shadow-[0_4px_15px_rgba(52,211,153,0.1)]">
                        <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-emerald-600 text-lg bg-emerald-50">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Health Credit Score & Early Warning Radar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[24px] p-6 border border-white relative overflow-hidden group hover:bg-white transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-5 transition-opacity duration-700 transform group-hover:scale-110">
                        <ShieldAlert className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-semibold text-xs text-slate-500 tracking-wider uppercase">{t("Health Score")}</h3>
                    </div>
                    <div className="flex items-end gap-3 mb-2">
                        <span className="text-5xl font-black text-slate-800 tracking-tight">842</span>
                        <span className="text-sm font-bold text-emerald-600 mb-2 flex items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 drop-shadow-sm">↑ 12 {t("pts")}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{t("Great job! You are doing well with your preventive care.")}</p>
                </motion.div>

                <Link href="/advanced/radar">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 backdrop-blur-xl rounded-[24px] p-6 border border-emerald-500/10 relative overflow-hidden group hover:border-emerald-500/20 transition-all cursor-pointer shadow-[0_8px_30px_rgba(52,211,153,0.05)]"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-semibold text-xs text-emerald-900 tracking-wider uppercase">{t("Body Scan")}</h3>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white/60 text-emerald-600 text-[10px] font-bold border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t("LIVE")}
                            </span>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-emerald-800 font-medium tracking-wide">{t("Sugar Levels")}</span>
                                <div className="flex-1 mx-4 h-1.5 bg-white/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 w-[12%] shadow-sm" />
                                </div>
                                <span className="text-sm text-emerald-900 font-bold">12%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-emerald-800 font-medium tracking-wide">{t("Heart Health")}</span>
                                <div className="flex-1 mx-4 h-1.5 bg-white/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 w-[24%] shadow-sm" />
                                </div>
                                <span className="text-sm text-amber-700 font-bold">24%</span>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </div>

            {/* Hyperlocal Disease Alerts */}
            <Link href="/advanced/alerts">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="mb-8 rounded-[24px] bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] cursor-pointer group hover:bg-white transition-all duration-300 border border-white"
                >
                    <div className="backdrop-blur-xl rounded-[23px] p-5 flex gap-4 items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 blur-2xl rounded-full" />
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 z-10">
                            <h4 className="text-xs font-bold text-emerald-600 tracking-wider uppercase mb-1">{t("Health Alerts")}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                <span className="font-bold text-slate-800">{t("Dengue Fever")}</span> {t("cases rising nearby. Stay safe.")}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </Link>

            {/* Daily Health Tip */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="mb-8 rounded-[24px] bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-100 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />
                <div className="backdrop-blur-xl rounded-[23px] p-6 relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        <h4 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">{t("Daily Health Tip")}</h4>
                    </div>
                    <p className="text-[15px] font-medium text-slate-800 leading-relaxed">
                        {t(healthTip)}
                    </p>
                </div>
            </motion.div>

            {/* AI Modals Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                    { link: "/advanced/lifestyle", icon: Activity, label: "Daily Habits", desc: "Healthy routines", from: "from-blue-50", to: "to-cyan-50", text: "text-blue-600", border: "border-blue-100", hover: "hover:border-blue-200 hover:shadow-blue-100/50", bg: "bg-blue-50" },
                    { link: "/advanced/mental", icon: Brain, label: "Mind Check", desc: "Mental wellness", from: "from-purple-50", to: "to-fuchsia-50", text: "text-purple-600", border: "border-purple-100", hover: "hover:border-purple-200 hover:shadow-purple-100/50", bg: "bg-purple-50" },
                    { link: "/advanced/medicine", icon: Pill, label: "Medicines", desc: "Drug information", from: "from-emerald-50", to: "to-teal-50", text: "text-emerald-600", border: "border-emerald-100", hover: "hover:border-emerald-200 hover:shadow-emerald-100/50", bg: "bg-emerald-50" },
                    { link: "/advanced/family", icon: UserPlus, label: "Family Hub", desc: "Track family health", from: "from-amber-50", to: "to-orange-50", text: "text-amber-600", border: "border-amber-100", hover: "hover:border-amber-200 hover:shadow-amber-100/50", bg: "bg-amber-50" },
                    { link: "/advanced/insurance", icon: ShieldCheck, label: "Health Insurance", desc: "Find insurance", from: "from-indigo-50", to: "to-blue-50", text: "text-indigo-600", border: "border-indigo-100", hover: "hover:border-indigo-200 hover:shadow-indigo-100/50", bg: "bg-indigo-50" },
                    { link: "/advanced/learning", icon: BookOpen, label: "Health Library", desc: "Simple guides", from: "from-rose-50", to: "to-red-50", text: "text-rose-600", border: "border-rose-100", hover: "hover:border-rose-200 hover:shadow-rose-100/50", bg: "bg-rose-50" },
                ].map((item, i) => (
                    <Link href={item.link} key={i}>
                        <motion.a
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (i * 0.05) }}
                            className={cn(
                                "flex flex-col items-start p-5 rounded-[24px] bg-white/80 backdrop-blur-md border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 text-left block cursor-pointer group relative overflow-hidden",
                                item.hover
                            )}
                        >
                            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", item.from, item.to)} />
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 border relative z-10", item.bg, item.border)}>
                                <item.icon className={cn("w-5 h-5", item.text)} />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 relative z-10 group-hover:text-slate-900">{t(item.label)}</h4>
                            <p className="text-[11px] text-slate-500 font-medium relative z-10 group-hover:text-slate-600">{t(item.desc)}</p>
                        </motion.a>
                    </Link>
                ))}
            </div>

            <Link href="/advanced/emergency">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                    className="mb-24 rounded-[24px] bg-red-50 shadow-[0_8px_30px_rgba(239,68,68,0.1)] cursor-pointer group hover:bg-red-100 transition-all duration-300 border border-red-100"
                >
                    <div className="backdrop-blur-xl rounded-[23px] p-5 flex gap-4 items-center relative overflow-hidden justify-center text-center">
                        <HeartPulse className="w-6 h-6 text-red-600 animate-pulse" />
                        <h4 className="text-sm font-bold text-red-700 tracking-wider uppercase">{t("Emergency SOS")}</h4>
                    </div>
                </motion.div>
            </Link>

        </MobileLayout>
    );
}
