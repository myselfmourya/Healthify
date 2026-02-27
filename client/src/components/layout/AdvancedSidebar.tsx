import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { cn } from "@/lib/utils";
import {
    Menu, X, Activity, Brain, Users, ShieldAlert, BadgeDollarSign, BookOpen, Settings, Home, HelpCircle
} from "lucide-react";

const advancedFeatures = [
    {
        category: "Core", items: [
            { icon: Home, label: "Home", href: "/" },
            { icon: Brain, label: "MIYA AI", href: "/ai" }
        ]
    },
    {
        category: "Predictive Intelligence", items: [
            { icon: Activity, label: "Body Scan", href: "/advanced/radar" },
            { icon: ShieldAlert, label: "Health Alerts", href: "/advanced/alerts" }
        ]
    },
    {
        category: "Lifestyle & Mental Health", items: [
            { icon: Brain, label: "Daily Habits", href: "/advanced/lifestyle" },
            { icon: Brain, label: "Mind Check", href: "/advanced/mental" }
        ]
    },
    {
        category: "Family & Genetics", items: [
            { icon: Users, label: "Family Hub", href: "/advanced/family" }
        ]
    },
    {
        category: "Emergency & Safety", items: [
            { icon: ShieldAlert, label: "Emergency SOS", href: "/advanced/emergency" }
        ]
    },
    {
        category: "Financial Intelligence", items: [
            { icon: BadgeDollarSign, label: "Medicines", href: "/advanced/medicine" },
            { icon: BadgeDollarSign, label: "Health Insurance", href: "/advanced/insurance" }
        ]
    },
    {
        category: "Learning & Engagement", items: [
            { icon: BookOpen, label: "Health Library", href: "/advanced/learning" }
        ]
    },
    {
        category: "Help & Support", items: [
            { icon: HelpCircle, label: "Support", href: "/advanced/support" },
            { icon: Settings, label: "Settings", href: "/settings" }
        ]
    }
];

export function AdvancedSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [location] = useLocation();
    const { t } = useStrictTranslation();

    return (
        <>
            {/* Hamburger Button (Fixed Top Left) */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-50 w-11 h-11 bg-white hover:bg-gray-50 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center transition-all md:hidden text-gray-700"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 z-[70] w-72 bg-white/90 backdrop-blur-2xl shadow-2xl flex flex-col md:w-80 border-r border-white/50"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">H</div>
                                    <span className="font-bold text-lg tracking-tight text-gray-900">Healthify <span className="text-emerald-600 font-extrabold text-[10px] ml-1 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">Pro</span></span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
                                {advancedFeatures.map((group, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{t(group.category)}</h3>
                                        <div className="space-y-1">
                                            {group.items.map((item, i) => {
                                                const isActive = location === item.href;
                                                const Icon = item.icon;
                                                return (
                                                    <Link key={i} href={item.href}>
                                                        <a onClick={() => setIsOpen(false)} className={cn(
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group text-sm font-medium relative overflow-hidden",
                                                            isActive ? "text-emerald-800 font-bold shadow-sm ring-1 ring-emerald-500/20" : "text-gray-600 hover:bg-white/60 hover:shadow-sm hover:text-gray-900"
                                                        )}>
                                                            {isActive && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-500" />}
                                                            <Icon className={cn("w-4 h-4 relative z-10 transition-transform", isActive ? "text-emerald-600 scale-110" : "text-gray-400 group-hover:text-emerald-500 group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                                                            <span className="relative z-10">{t(item.label)}</span>
                                                        </a>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar variant (always visible) */}
            <aside className="hidden md:flex flex-col w-72 bg-white/80 backdrop-blur-2xl border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed h-full z-40">
                <div className="flex items-center gap-2 mb-8 px-6 mt-6">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">H</div>
                    <span className="font-bold text-lg tracking-tight text-gray-900">Healthify <span className="text-emerald-600 font-extrabold text-[10px] ml-1 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">Pro</span></span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6">
                    {advancedFeatures.map((group, idx) => (
                        <div key={idx} className="space-y-2">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{t(group.category)}</h3>
                            <div className="space-y-1">
                                {group.items.map((item, i) => {
                                    const isActive = location === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link key={i} href={item.href}>
                                            <a className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group text-sm font-medium relative overflow-hidden",
                                                isActive ? "text-emerald-800 font-bold shadow-sm ring-1 ring-emerald-500/20" : "text-gray-600 hover:bg-white/60 hover:shadow-sm hover:text-gray-900"
                                            )}>
                                                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-500" />}
                                                <Icon className={cn("w-4 h-4 relative z-10 transition-transform", isActive ? "text-emerald-600 scale-110" : "text-gray-400 group-hover:text-emerald-500 group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="relative z-10">{t(item.label)}</span>
                                            </a>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
}
