import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Sparkles, Home, Stethoscope, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { AdvancedSidebar } from "./AdvancedSidebar";

interface MobileLayoutProps { children: React.ReactNode; }

const navItems = [
  { icon: Home, href: "/" },
  { icon: Stethoscope, href: "/consult" },
  { icon: Sparkles, href: "/ai", isFab: true },
  { icon: FileText, href: "/records" },
  { icon: Settings, href: "/settings" },
];

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const { unreadCount } = useNotifications();
  const { t } = useStrictTranslation();
  const { user } = useUser();
  const isAdvancedMode = user?.appMode === "advanced";

  return (
    <div className="flex w-full min-h-[100dvh] bg-white relative overflow-hidden">
      {/* ── Abstract Colorful Background Elements (Disabled in Low Connectivity Mode) ── */}
      {!user.lowConnectivityMode && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] min-w-[300px] min-h-[300px] rounded-full bg-pink-400/20 mix-blend-multiply filter blur-3xl opacity-50"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] -right-[10%] w-[45vw] h-[45vw] min-w-[250px] min-h-[250px] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-3xl opacity-50"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] left-[20%] w-[60vw] h-[60vw] min-w-[350px] min-h-[350px] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-3xl opacity-50"
          />
        </div>
      )}

      {isAdvancedMode ? (
        <AdvancedSidebar />
      ) : (
        /* ── Beginner Desktop Sidebar Navigation (Hidden on Mobile) ── */
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-4 fixed h-full z-40">
          <div className="flex items-center gap-2 mb-10 px-2 mt-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">H</div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Healthify</span>
          </div>

          <nav className="flex-1 space-y-1.5">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group",
                    item.isFab ? "mt-6 bg-[#12121e] text-pink-400 hover:bg-black hover:shadow-lg hover:shadow-pink-500/20" :
                      isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-medium"
                  )}>
                    <Icon className={cn("w-5 h-5", item.isFab ? "text-pink-400" : isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} strokeWidth={isActive || item.isFab ? 2.5 : 2} />
                    <span className="text-sm">{t(item.isFab ? "AI Assistant" : item.href === "/" ? "Home" : item.href.replace("/", "").charAt(0).toUpperCase() + item.href.slice(2))}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* ── Main content area ── */}
      <main className={cn(
        "flex-1 flex flex-col w-full h-[100dvh] overflow-hidden bg-transparent relative z-10 transition-all",
        isAdvancedMode ? "md:pl-72" : "md:pl-64"
      )}>
        {/* Scrollable Container - taking full height */}
        <div className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden w-full",
          isAdvancedMode ? "pb-8" : "pb-24 md:pb-8"
        )}>
          {/* Content container - fills width on mobile, centered max-width on larger screens */}
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl flex-1 flex flex-col pt-16 md:pt-10 transition-all duration-300">
            {children}
          </div>
        </div>
      </main>


      {/* ── Beginner Mobile Bottom Navigation Bar (Hidden on Desktop) ── */}
      {!isAdvancedMode && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
          <div className="w-full">
            <nav className="px-2 py-2 flex items-center justify-around relative">
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                const Icon = item.icon;

                if (item.isFab) {
                  return (
                    <Link key={item.href} href={item.href}>
                      <a className={cn(
                        "relative -top-6 w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200",
                        isActive
                          ? "bg-[#12121e] text-pink-400 scale-110 shadow-[0_0_20px_rgba(236,72,153,0.3)] border-[3px] border-[#12121e]"
                          : "bg-[#12121e] text-pink-400 hover:scale-105 shadow-xl border-[3px] border-[#12121e] shadow-black/10"
                      )}>
                        <Icon className="h-6 w-6" strokeWidth={2.5} />
                      </a>
                    </Link>
                  );
                }

                return (
                  <Link key={item.href} href={item.href}>
                    <a className={cn(
                      "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200",
                      isActive ? "text-indigo-600 bg-indigo-100/50" : "text-gray-400 hover:text-gray-600"
                    )}>
                      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}