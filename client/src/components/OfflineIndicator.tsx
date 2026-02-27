import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-6 px-4 pointer-events-none"
                >
                    <div className="bg-slate-900/90 text-white px-7 py-4 rounded-[24px] shadow-2xl border border-white/10 flex items-center gap-4 backdrop-blur-2xl max-w-sm pointer-events-auto">
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                            <WifiOff className="w-5 h-5 text-rose-400 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm font-black tracking-tight leading-none mb-1">Beginner Mode: Offline</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Local records & MIYA AI active</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
