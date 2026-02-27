import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, MapPin, RefreshCcw, BellRing, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";

interface Outbreak {
    id: string;
    disease: string;
    casesReported: number;
    riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
    recommendation: string;
}

export default function Alerts() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [alerts, setAlerts] = useState<Outbreak[]>([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState("Determining location...");

    const fetchOutbreaks = async (locName: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/advanced/outbreaks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location: locName })
            });
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Simulate grabbing GPS / user location
        setTimeout(() => {
            const simulatedLoc = "Metropolitan Area (Zone 4)";
            setLocation(simulatedLoc);
            fetchOutbreaks(simulatedLoc);
        }, 800);
    }, []);

    const riskColor = {
        "CRITICAL": "bg-rose-50 border-rose-200 text-rose-800",
        "HIGH": "bg-orange-50 border-orange-200 text-orange-800",
        "MODERATE": "bg-amber-50 border-amber-200 text-amber-800",
        "LOW": "bg-emerald-50 border-emerald-200 text-emerald-800",
    };

    const riskBadge = {
        "CRITICAL": "bg-rose-500 text-white",
        "HIGH": "bg-orange-500 text-white",
        "MODERATE": "bg-amber-500 text-white",
        "LOW": "bg-emerald-500 text-white",
    };

    return (
        <MobileLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-emerald-600" />
                        {t("Hyperlocal Alerts")}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {t(location)}
                    </p>
                </div>
                <button
                    onClick={() => fetchOutbreaks(location)}
                    disabled={loading}
                    className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
                >
                    <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            <div className="space-y-4">
                {/* Status overview */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Target className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Current Status")}</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">
                            {loading ? t("Scanning region...") : `${alerts.length} ${t("active outbreak patterns detected nearby.")}`}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="relative w-16 h-16 mb-4">
                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                            <div className="absolute inset-2 bg-emerald-500 rounded-full animate-ping opacity-40 delay-150" />
                            <div className="absolute inset-4 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                                <Activity className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-gray-500">{t("Triangulating epidemiological data...")}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {alerts.map((alert, i) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    className={cn("rounded-2xl p-4 border", riskColor[alert.riskLevel])}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{t(alert.disease)}</h3>
                                            <p className="text-xs opacity-80 mt-0.5">{alert.casesReported} {t("cases reported locally")}</p>
                                        </div>
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", riskBadge[alert.riskLevel])}>
                                            {t(alert.riskLevel)}
                                        </span>
                                    </div>
                                    <div className="bg-white/50 rounded-xl p-3 flex gap-3 items-start mt-2">
                                        <BellRing className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                                        <p className="text-sm font-medium leading-snug">{t(alert.recommendation)}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {alerts.length === 0 && !loading && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
                                <ShieldAlert className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                                <h3 className="font-bold text-emerald-800 mb-1">{t("All Clear")}</h3>
                                <p className="text-sm text-emerald-600/80">{t("No significant disease outbreaks detected in your immediate vicinity.")}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
