import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function useOfflineStatus() {
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

    return isOffline;
}

export function OfflineBanner() {
    const isOffline = useOfflineStatus();

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-orange-600 text-white py-2 px-4 shadow-md flex items-center justify-center gap-2"
                >
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-bold tracking-wide">You are currently offline. Showing cached data.</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
