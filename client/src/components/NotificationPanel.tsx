import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, Calendar, Newspaper, FolderHeart, AlertTriangle, Info, Trash2 } from "lucide-react";
import { useNotifications, Notification } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";

const iconMap: Record<string, any> = {
    appointment: Calendar,
    news: Newspaper,
    record: FolderHeart,
    alert: AlertTriangle,
    prediction: AlertTriangle,
    info: Info,
};
const colorMap: Record<string, string> = {
    appointment: "bg-blue-100 text-blue-600",
    news: "bg-purple-100 text-purple-600",
    record: "bg-green-100 text-green-600",
    alert: "bg-red-100 text-red-600",
    prediction: "bg-orange-100 text-orange-600",
    info: "bg-gray-100 text-gray-600",
};

function formatTime(iso: string, t: any) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return t("Just now");
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t("m ago")}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t("h ago")}`;
    return d.toLocaleDateString();
}

interface Props { open: boolean; onClose: () => void; }

export function NotificationPanel({ open, onClose }: Props) {
    const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
    const { t } = useStrictTranslation();

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-blue-600" />
                                <h2 className="font-bold text-gray-900">{t("Notifications")}</h2>
                                {unreadCount > 0 && (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" /> {t("Mark all read")}
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button onClick={clearAll} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Bell className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="font-medium">{t("No notifications yet")}</p>
                                    <p className="text-sm">{t("You'll see health updates here")}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((n: Notification) => {
                                        const Icon = iconMap[n.type] || Info;
                                        const colorCls = colorMap[n.type] || "bg-gray-100 text-gray-600";
                                        return (
                                            <motion.div
                                                key={n.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "flex gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                                                    !n.read && "bg-blue-50/50"
                                                )}
                                                onClick={() => markRead(n.id)}
                                            >
                                                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5", colorCls)}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={cn("text-sm font-semibold text-gray-900 leading-tight", !n.read && "text-blue-900")}>
                                                            {n.title}
                                                        </p>
                                                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{t(n.message)}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{formatTime(n.timestamp, t)}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
