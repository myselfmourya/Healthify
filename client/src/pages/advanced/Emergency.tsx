import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { motion } from "framer-motion";
import { Phone, Navigation, Activity, Hospital, ShieldAlert, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Emergency() {
    const { t } = useStrictTranslation();
    const { user } = useUser();
    const [sosActive, setSosActive] = useState(false);

    // Mock hospitals for UI
    const hospitals = [
        { name: t("City General Hospital"), distance: "0.8 km", status: t("Open 24/7"), emergencyDiv: true },
        { name: t("Metro Care Center"), distance: "2.1 km", status: t("Open 24/7"), emergencyDiv: true },
        { name: t("First Response Clinic"), distance: "3.5 km", status: t("Open Until 10 PM"), emergencyDiv: false }
    ];

    const toggleSos = () => {
        setSosActive(true);
        if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 500]);
        }
        setTimeout(() => setSosActive(false), 5000);
    };

    return (
        <MobileLayout>
            <div className="absolute inset-0 bg-slate-50 z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-rose-100/60 blur-[100px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-red-100/60 blur-[100px] rounded-full mix-blend-multiply" />
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
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-600">{t("Emergency SOS")}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">
                            {t("Get Help Now")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {/* SOS Button */}
                <div className="bg-white/80 rounded-[32px] p-8 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center relative overflow-hidden h-[300px] backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent pointer-events-none mix-blend-overlay" />

                    <button
                        onClick={toggleSos}
                        className="relative group z-10 focus:outline-none"
                    >
                        <div className={cn("absolute inset-0 rounded-full blur-[40px] transition-all duration-500",
                            sosActive ? "bg-rose-500 scale-150 animate-ping opacity-30" : "bg-rose-300 group-hover:scale-125 group-hover:bg-rose-400 opacity-20"
                        )} />

                        <div className={cn("relative z-10 w-40 h-40 rounded-full bg-gradient-to-b from-rose-500 to-rose-600 shadow-[0_8px_30px_rgba(225,29,72,0.3)] flex items-center justify-center border-4 border-white transition-transform duration-300",
                            sosActive && "scale-95 bg-gradient-to-b from-rose-600 to-rose-700"
                        )}>
                            <div className="text-center">
                                <ShieldAlert className="w-12 h-12 text-white mx-auto mb-1" />
                                <span className="font-bold text-white text-3xl tracking-widest">SOS</span>
                            </div>
                        </div>
                    </button>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-10 z-10">
                        {sosActive ? t("Sending Alert...") : t("Tap & Hold to Call for Help")}
                    </p>
                </div>

                {/* Medical ID for First Responders */}
                <div className="bg-white/80 rounded-[32px] p-6 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-slate-800 relative h-fit backdrop-blur-xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <Activity className="w-32 h-32 text-rose-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-rose-600" />
                        </div>
                        <h2 className="text-xs font-bold tracking-widest uppercase text-slate-800">{t("Medical ID")}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-2">{t("Blood Type")}</p>
                            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-rose-600">{user.bloodGroup || "O+"}</p>
                        </div>
                        <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">{t("Allergies")}</p>
                            <p className="text-xs font-bold text-rose-600 leading-tight">
                                {user.allergies?.length ? user.allergies.join(", ") : t("None Known")}
                            </p>
                        </div>
                        <div className="col-span-2 bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-2">{t("Medical Conditions")}</p>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                {user.diseases?.length ? user.diseases.join(", ") : t("No pre-existing conditions registered")}
                            </p>
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-5 text-center uppercase tracking-widest flex items-center justify-center gap-2 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                        {t("Available Offline")}
                    </p>
                </div>

                {/* Nearby Hospitals */}
                <div className="md:col-span-2 bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-slate-800 flex items-center gap-3 uppercase tracking-wider text-xs">
                            <Hospital className="w-5 h-5 text-rose-600" />
                            {t("Nearby Hospitals")}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {hospitals.map((h, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-white rounded-[20px] border border-slate-200 shadow-sm transition-all hover:border-rose-200 hover:shadow-[0_4px_15px_rgba(225,29,72,0.05)]">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm tracking-wide">{h.name}</h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">{h.distance}</p>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <p className={cn("text-[10px] font-bold uppercase tracking-widest", h.emergencyDiv ? "text-emerald-600" : "text-amber-600")}>
                                            {h.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm">
                                        <Navigation className="w-5 h-5" />
                                    </button>
                                    <button className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm">
                                        <Phone className="w-5 h-5 flex-shrink-0 relative left-0.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
}
