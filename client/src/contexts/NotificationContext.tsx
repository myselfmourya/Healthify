import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface Notification {
    id: string;
    type: "appointment" | "news" | "record" | "alert" | "info" | "prediction";
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    link?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notif: Omit<Notification, "id" | "timestamp" | "read">) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    clearAll: () => void;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const stored = localStorage.getItem("healthify_notifications");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            }
            return [];
        } catch { return []; }
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    const save = (notifs: Notification[]) => {
        setNotifications(notifs);
        try { localStorage.setItem("healthify_notifications", JSON.stringify(notifs.slice(0, 100))); } catch { }
    };

    const addNotification = useCallback((notif: Omit<Notification, "id" | "timestamp" | "read">) => {
        const newNotif: Notification = {
            ...notif,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: new Date().toISOString(),
            read: false,
        };
        setNotifications((prev) => {
            const next = [newNotif, ...prev].slice(0, 100);
            try { localStorage.setItem("healthify_notifications", JSON.stringify(next)); } catch { }
            return next;
        });
    }, []);

    const markRead = useCallback((id: string) => {
        setNotifications((prev) => {
            const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
            try { localStorage.setItem("healthify_notifications", JSON.stringify(next)); } catch { }
            fetch(`/api/notifications/${id}/read`, { method: "PUT" }).catch(() => { });
            return next;
        });
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => {
            const next = prev.map((n) => ({ ...n, read: true }));
            try { localStorage.setItem("healthify_notifications", JSON.stringify(next)); } catch { }
            fetch("/api/notifications/read-all", { method: "PUT" }).catch(() => { });
            return next;
        });
    }, []);

    const clearAll = useCallback(() => {
        save([]);
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setNotifications((prev) => {
                    const existingIds = new Set(prev.map((n) => n.id));
                    const newOnes = data.filter((n: Notification) => !existingIds.has(n.id));
                    if (newOnes.length === 0) return prev;
                    const next = [...newOnes, ...prev].slice(0, 100);
                    try { localStorage.setItem("healthify_notifications", JSON.stringify(next)); } catch { }
                    return next;
                });
            }
        } catch { }
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
    return ctx;
}
