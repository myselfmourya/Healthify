import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell, CalendarPlus, Stethoscope, MessageCircle, MapPin,
  Sparkles, ChevronRight, Activity, Newspaper, ArrowUpRight,
  Heart, Pill, ShieldCheck
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationPanel } from "@/components/NotificationPanel";
import { cn } from "@/lib/utils";
import AdvancedDashboard from "@/pages/AdvancedDashboard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good Night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// Quick action tabs — clean single-color design
const QUICK_ACTIONS = [
  { icon: Sparkles, label: "AI Consult", href: "/ai?tab=chat" },
  { icon: Stethoscope, label: "Checkup", href: "/ai?tab=symptoms" },
  { icon: MessageCircle, label: "Consult", href: "/consult" },
  { icon: MapPin, label: "Hospital", href: "/info?tab=hospitals" },
  { icon: Newspaper, label: "News", href: "/info?tab=news" },
];

// Info shortcut cards
const INFO_CARDS = [
  { label: "Medicines", href: "/info?tab=medicines", emoji: "💊", color: "bg-blue-50 text-blue-700" },
  { label: "Insurance", href: "/info?tab=insurance", emoji: "🛡️", color: "bg-indigo-50 text-indigo-700" },
  { label: "Hospitals", href: "/info?tab=hospitals", emoji: "🏥", color: "bg-sky-50 text-sky-700" },
  { label: "Health News", href: "/info?tab=news", emoji: "📰", color: "bg-slate-50 text-slate-700" },
];

export default function Home() {
  const { user, bmi, bmiCategory } = useUser();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const [healthTip, setHealthTip] = useState("Stay hydrated — drink at least 8 glasses of water daily!");
  const [appointment, setAppointment] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  if (user?.appMode === "advanced") {
    return <AdvancedDashboard />;
  }

  useEffect(() => {
    fetch("/api/health-tips").then(r => r.json()).then(d => setHealthTip(d.tip)).catch(() => { });
    fetch("/api/appointments").then(r => r.json()).then(json => {
      if (!json || json.error || json.success === false) return;
      const d = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      if (d.length) setAppointment(d[0]);
    }).catch(() => { });
    fetch("/api/news").then(r => r.json()).then(json => {
      if (!json || json.error || json.success === false) {
        setNewsLoading(false);
        return;
      }
      const d = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      if (d.length) {
        setNews(d.slice(0, 3));
        localStorage.setItem("healthify_news_cache", JSON.stringify(d));
      }
      setNewsLoading(false);
    }).catch(() => setNewsLoading(false));
  }, []);

  const displayName = user.name || "Friend";
  const firstName = displayName.split(" ")[0];
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <MobileLayout>
      <NotificationPanel open={showNotif} onClose={() => setShowNotif(false)} />

      {/* ── Header ── */}
      <header className="flex justify-between items-center mb-7">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
            <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${displayName}&background=2563eb&color=fff&rounded=true`} />
            <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">{initials || "HF"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-gray-400 font-medium">{t(getGreeting())}</p>
            <h1 className="text-base font-bold text-gray-900">{firstName} 👋</h1>
          </div>
        </div>
        <button
          onClick={() => setShowNotif(true)}
          className="h-10 w-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 relative hover:bg-gray-50 transition-colors"
          aria-label={t("Toggle Notifications")}
        >
          <Bell className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* ── Hero Heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <p className="text-sm text-gray-400 font-medium mb-1">{t("My Treatment")}</p>
        <h2 className="text-[28px] font-bold text-gray-900 leading-[1.2]">
          {t("I Hope You're")} <span className="text-blue-600">{t("Feeling Well")}</span> {t("Today!")}
        </h2>
      </motion.div>

      {/* ── Quick Action Pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-2.5 pb-2 mb-6"
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link href={action.href} key={action.label}>
              <a className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-800 px-3 py-2.5 rounded-2xl text-[13px] font-bold whitespace-nowrap transition-all shadow-sm">
                <Icon className="w-4 h-4 shrink-0 text-blue-600" />
                {t(action.label)}
              </a>
            </Link>
          );
        })}
      </motion.div>

      {/* ── Premium Aesthetic Promo Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.08 }}
        className="rounded-[2rem] p-6 mb-8 relative overflow-hidden shadow-2xl shadow-blue-900/20 bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex flex-col justify-between min-h-[180px] border border-white/10"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4" />

        {/* Abstract Floating Icons instead of Doctor Image */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none">
          <motion.div animate={{ y: [-4, 4, -4], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="absolute top-0 right-4 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-lg transform rotate-12">
            <Stethoscope className="w-6 h-6 text-blue-200" />
          </motion.div>
          <motion.div animate={{ y: [4, -4, 4], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }} className="absolute bottom-2 left-0 w-14 h-14 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full p-0.5 shadow-xl shadow-cyan-500/30">
            <div className="w-full h-full bg-slate-900/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white/20" />
            </div>
          </motion.div>
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-cyan-400 blur-sm" />
        </div>

        <div className="relative z-10 w-[70%]">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-cyan-50 text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 backdrop-blur-md border border-white/10 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-cyan-300" /> {t("Smart Health Care")}
          </span>
          <h3 className="text-2xl font-black text-white mb-4 leading-[1.15] tracking-tight">
            {t("Consult Top")}<br />{t("Doctors")} <span className="text-cyan-300">{t("Instantly")}</span>
          </h3>
          <Link href="/consult">
            <a className="inline-flex items-center w-fit gap-2 bg-white text-indigo-900 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10">
              {t("Book Appointment")} <ArrowUpRight className="w-4 h-4" />
            </a>
          </Link>
        </div>
      </motion.div>

      {/* ── Daily MIYA Health Tip ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}
        className="mb-8"
      >
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {t("Daily MIYA Tip")}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{t("Your AI health companion says:")}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-200/40 rounded-full blur-2xl" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-orange-200/40 rounded-full blur-2xl" />

          <div className="flex gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-100">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 leading-relaxed">
                {t(healthTip)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Health News (Moved Up) ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-900">{t("Health News")}</h3>
          <Link href="/info?tab=news">
            <a className="text-[13px] text-blue-600 font-bold flex items-center gap-0.5">
              {t("View all")} <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </Link>
        </div>

        {newsLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse border border-gray-100">
                <div className="h-2 bg-gray-100 rounded w-1/5 mb-2.5" />
                <div className="h-3 bg-gray-100 rounded w-4/5 mb-1.5" />
              </div>
            ))}
          </div>
        ) : news.length > 0 ? (
          <div className="space-y-3">
            {news.map((item: any, idx: number) => (
              <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="bg-white rounded-[1.5rem] p-5 flex flex-col gap-2 shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">{item.source || t('Healthify Medical')}</span>
                    <h4 className="text-[14px] font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">{item.title}</h4>
                  </div>
                </div>
                {item.description && (
                  <p className="text-[12px] text-gray-600 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50/80">
                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5"><CalendarPlus className="w-3 h-3 text-gray-300" /> {new Date().toLocaleDateString()}</span>
                  <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">{t("Read Article")} <ArrowUpRight className="w-3 h-3" /></span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[1.5rem] p-5 text-center border border-gray-100">
            <Newspaper className="w-7 h-7 text-gray-200 mx-auto mb-3" />
            <p className="text-[15px] font-bold text-gray-800">{t("Powered by MIYA AI")}</p>
            <p className="text-[13px] text-gray-500 mt-1 font-medium">{t("AI is analyzing health news")}</p>
          </div>
        )}
      </motion.div>

      {/* ── Recent Doctor's Appointment (Moved Final) ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.11 }}
        className="mb-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-900">{t("Recent Appointment")}</h3>
        </div>

        {appointment ? (
          <Link href="/consult">
            <a className="bg-white rounded-[1.5rem] p-4 flex gap-4 items-center shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-all block relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-[4rem] -z-10" />
              <img
                src={appointment.doctorImage || `https://ui-avatars.com/api/?name=${appointment.doctorName}&background=dbeafe&color=1d4ed8&size=128`}
                alt={appointment.doctorName}
                className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-blue-50 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-[15px]">{appointment.doctorName}</h4>
                <p className="text-[13px] text-blue-600 font-bold mt-0.5">{appointment.doctorSpecialty}</p>
                <div className="flex items-center gap-1 mt-1.5 opacity-60">
                  <CalendarPlus className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[11px] text-gray-500 font-bold">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div className="shrink-0 text-center">
                <div className="w-10 h-10 bg-[#12121e] rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <MessageCircle className="w-4 h-4 text-pink-400" />
                </div>
              </div>
            </a>
          </Link>
        ) : (
          <Link href="/consult">
            <a className="bg-white rounded-[1.5rem] p-6 border border-dashed border-gray-300 text-center block hover:bg-gray-50 transition-colors">
              <CalendarPlus className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <p className="text-[15px] font-bold text-gray-900">{t("Book a Consultation")}</p>
              <p className="text-[12px] text-gray-500 mt-1">{t("Schedule an appointment with top doctors")}</p>
            </a>
          </Link>
        )}
      </motion.div>
    </MobileLayout>
  );
}