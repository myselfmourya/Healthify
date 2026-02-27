import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Bell, Globe, Phone, Shield, ChevronRight, LogOut, Info,
  Edit3, Lock, PhoneCall, Heart, Trash2, Check, X, AlertCircle, Layout, Sparkles, WifiOff
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी (Hindi)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "or", name: "ଓଡ଼ିଆ (Odia)" },
  { code: "as", name: "অসমীয়া (Assamese)" },
  { code: "ur", name: "اردو (Urdu)" },
];

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

function Toggle({ on, onToggle, isPro }: { on: boolean; onToggle: () => void; isPro?: boolean; }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-1 shrink-0",
        on ? (isPro ? "bg-emerald-600" : "bg-blue-600") : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 shrink-0",
          on ? "translate-x-6" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function Settings() {
  const { user, updateUser } = useUser();
  const { t, setLanguage } = useLanguage();
  const displayName = user.name || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const isPro = user?.appMode === "advanced";
  const tBgPri = isPro ? "bg-emerald-600" : "bg-blue-600";
  const tTextPri = isPro ? "text-emerald-600" : "text-blue-600";
  const tBgSub = isPro ? "bg-emerald-50" : "bg-blue-50";
  const tHoverSub = isPro ? "hover:bg-emerald-100" : "hover:bg-blue-100";
  const tBorderPri = isPro ? "border-emerald-600" : "border-blue-600";
  const tBorderSub = isPro ? "border-emerald-500" : "border-blue-500";
  const tRing = isPro ? "focus:ring-emerald-500" : "focus:ring-blue-500";

  // Local states
  const [notifications, setNotifications] = useState(true);
  const [healthReminders, setHealthReminders] = useState(true);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [selectedLang, setSelectedLang] = useState(
    LANGUAGES.find(l => l.code === (user as any).language) || LANGUAGES[0]
  );

  const [profileForm, setProfileForm] = useState<{
    name: string;
    age: string | number;
    gender: "Male" | "Female" | "Other" | string;
    location: string;
    bloodGroup: string;
  }>({
    name: user.name || "",
    age: user.age || "",
    gender: user.gender || "",
    location: (user as any).location || "",
    bloodGroup: (user as any).bloodGroup || "",
  });

  // Emergency contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    (user as any).emergencyContacts || []
  );
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" });

  const saveProfile = () => {
    updateUser({
      name: profileForm.name,
      age: typeof profileForm.age === "string" ? parseInt(profileForm.age) || 0 : profileForm.age,
      gender: profileForm.gender as any,
      location: profileForm.location,
      bloodGroup: profileForm.bloodGroup,
    } as any);
    setShowProfileEdit(false);
  };

  const saveLang = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    setLanguage(lang.code);
    updateUser({ language: lang.code } as any);
    setShowLangSheet(false);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return;
    const updated = [...contacts, newContact];
    setContacts(updated);
    updateUser({ emergencyContacts: updated } as any);
    setNewContact({ name: "", phone: "", relation: "" });
  };

  const removeContact = (i: number) => {
    const updated = contacts.filter((_, idx) => idx !== i);
    setContacts(updated);
    updateUser({ emergencyContacts: updated } as any);
  };

  return (
    <MobileLayout>
      <div className="animate-in fade-in duration-500 pb-4">

        {/* ── Profile Header Card ── */}
        <div className="glass rounded-3xl p-5 mb-6 flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
              <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${displayName}&background=1d4ed8&color=fff&rounded=true`} />
              <AvatarFallback className={cn("text-white font-bold text-lg", tBgPri)}>{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => setShowProfileEdit(true)}
              className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white", tBgPri)}
            >
              <Edit3 className="w-3 h-3 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg">{displayName}</h2>
            <p className="text-sm text-gray-500">
              {user.age ? `${user.age} ${t("yrs")}` : ""}
              {user.age && user.gender ? " · " : ""}
              {t(user.gender || "")}
            </p>
            <p className={cn("text-xs font-medium mt-0.5", tTextPri)}>{(user as any).location || t("Set your location")} →</p>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className={cn("p-2 rounded-xl transition-colors", tBgSub, tTextPri, tHoverSub)}
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* ── Settings Sections ── */}
        <div className="space-y-4">

          {/* Account */}
          <SettingsSection title={t("Account & Experience")}>
            <SettingsRow isPro={isPro}
              icon={User} label={t("Edit Profile")}
              sub={t("Update your personal info")}
              onClick={() => setShowProfileEdit(true)}
            />
            <SettingsRow isPro={isPro}
              icon={Globe} label={t("Language")}
              sub={t(selectedLang.name)}
              onClick={() => setShowLangSheet(true)}
            />
            <div className="flex items-center justify-between py-3 px-4 backdrop-blur-sm bg-blue-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200/50">
                  <Layout className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">{t("Advanced Mode")} <Sparkles className="w-3 h-3 text-indigo-500" /></p>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">{user.appMode === "advanced" ? t("Currently Active") : t("Switch to Pro")}</p>
                </div>
              </div>
              <Toggle isPro={isPro} on={user.appMode === "advanced"} onToggle={() => updateUser({ appMode: user.appMode === "advanced" ? "beginner" : "advanced" })} />
            </div>
            <div className="flex items-center justify-between py-3 px-4 backdrop-blur-sm bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-200/50">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t("Caregiver Mode")}</p>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">{user.isCaregiverMode ? t("Read-Only Active") : t("Enable View Access")}</p>
                </div>
              </div>
              <Toggle isPro={isPro} on={!!user.isCaregiverMode} onToggle={() => updateUser({ isCaregiverMode: !user.isCaregiverMode })} />
            </div>
            <div className="flex items-center justify-between py-3 px-4 backdrop-blur-sm bg-orange-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200/50">
                  <WifiOff className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t("Low Data Mode")}</p>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-0.5">{user.lowConnectivityMode ? t("Adaptive Scaling On") : t("Standard Experience")}</p>
                </div>
              </div>
              <Toggle isPro={isPro} on={!!user.lowConnectivityMode} onToggle={() => updateUser({ lowConnectivityMode: !user.lowConnectivityMode })} />
            </div>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection title={t("Notifications")}>
            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", tBgSub)}>
                  <Bell className={cn("w-4 h-4", tTextPri)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t("Health Alerts")}</p>
                  <p className="text-xs text-gray-500">{t("Appointment & medication reminders")}</p>
                </div>
              </div>
              <Toggle isPro={isPro} on={notifications} onToggle={() => setNotifications(!notifications)} />
            </div>
            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t("Health Tips")}</p>
                  <p className="text-xs text-gray-500">{t("Daily MIYA health tips")}</p>
                </div>
              </div>
              <Toggle isPro={isPro} on={healthReminders} onToggle={() => setHealthReminders(!healthReminders)} />
            </div>
          </SettingsSection>

          {/* Emergency */}
          <SettingsSection title={t("Emergency Contacts")}>
            <SettingsRow isPro={isPro}
              icon={PhoneCall} label={t("Manage Contacts")}
              sub={contacts.length > 0 ? `${contacts.length} ${t("contact" + (contacts.length > 1 ? "s" : ""))} ${t("saved")}` : t("No contacts added yet")}
              onClick={() => setShowEmergency(true)}
              accent="red"
            />
            {contacts.length > 0 && (
              <div className="px-4 pb-3 space-y-2">
                {contacts.slice(0, 2).map((c, i) => (
                  <div key={i} className="bg-red-50 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-500">{c.phone} · {t(c.relation)}</p>
                    </div>
                    <a href={`tel:${c.phone}`} className="p-1 bg-red-100 rounded-lg">
                      <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </SettingsSection>

          {/* Privacy */}
          <SettingsSection title={t("Privacy & Security")}>
            <SettingsRow isPro={isPro} icon={Lock} label={t("Privacy Policy")} sub={t("Data stored locally on device")} />
            <SettingsRow isPro={isPro} icon={Shield} label={t("Data & Storage")} sub={t("All data kept on your phone")} />
          </SettingsSection>

          {/* About */}
          <SettingsSection title={t("About")}>
            <SettingsRow isPro={isPro} icon={Info} label={t("About Healthify")} sub={t("Version 1.0.0 · Powered by MIYA AI")} />
            <SettingsRow isPro={isPro}
              icon={AlertCircle} label={t("Reset Onboarding")}
              sub={t("Clear data and restart setup")}
              accent="red"
              onClick={() => setShowConfirmReset(true)}
            />
          </SettingsSection>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmReset}
        title={t("Reset Data?")}
        description={t("This will erase all your local data and restart the setup. This action cannot be undone.")}
        confirmText={t("Delete")}
        cancelText={t("Cancel")}
        danger={true}
        onConfirm={() => {
          localStorage.clear();
          window.location.reload();
        }}
        onCancel={() => setShowConfirmReset(false)}
      />

      {/* ── Language Bottom Sheet ── */}
      <AnimatePresence>
        {showLangSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowLangSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-50 px-5 pt-4 pb-8"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
              <h3 className="font-bold text-gray-900 text-lg mb-4">{t("Choose Language")}</h3>
              <div className="overflow-y-auto scrollbar-none max-h-72 space-y-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => saveLang(lang)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      selectedLang.code === lang.code
                        ? cn("text-white", tBgPri)
                        : "hover:bg-gray-100 text-gray-800"
                    )}
                  >
                    {lang.name}
                    {selectedLang.code === lang.code && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Profile Edit Bottom Sheet ── */}
      <AnimatePresence>
        {showProfileEdit && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowProfileEdit(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-50 px-5 pt-4 pb-8"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">{t("Edit Profile")}</h3>
                <button onClick={() => setShowProfileEdit(false)} className="p-2 rounded-xl bg-gray-100">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto scrollbar-none max-h-96">
                {[
                  { key: "name", label: t("Full Name"), placeholder: t("Your name") },
                  { key: "age", label: t("Age"), placeholder: t("e.g. 28"), type: "number" },
                  { key: "location", label: t("Location / Village"), placeholder: t("Your village or city") },
                  { key: "bloodGroup", label: t("Blood Group"), placeholder: t("e.g. O+") },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">{field.label}</label>
                    <input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={(profileForm as any)[field.key]}
                      onChange={e => setProfileForm(p => ({ ...p, [field.key]: e.target.value }))}
                      className={cn("w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50", isPro ? "focus:border-emerald-500" : "focus:border-blue-500")}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">{t("Gender")}</label>
                  <div className="flex gap-2">
                    {["Male", "Female", "Other"].map(g => (
                      <button
                        key={g}
                        onClick={() => setProfileForm(p => ({ ...p, gender: g }))}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border",
                          profileForm.gender === g
                            ? cn("text-white", tBgPri, tBorderPri)
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        {t(g)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={saveProfile}
                className={cn("w-full mt-4 py-3.5 text-white rounded-2xl font-bold text-sm transition-colors", tBgPri, isPro ? "hover:bg-emerald-700" : "hover:bg-blue-700")}
              >
                {t("Save Changes")}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Emergency Contacts Bottom Sheet ── */}
      <AnimatePresence>
        {showEmergency && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowEmergency(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white rounded-t-3xl z-50 px-5 pt-4 pb-8"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">{t("Emergency Contacts")}</h3>
                <button onClick={() => setShowEmergency(false)} className="p-2 rounded-xl bg-gray-100">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Existing contacts */}
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none mb-4">
                {contacts.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-400">{t("No contacts yet. Add one below.")}</div>
                ) : (
                  contacts.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-2xl">
                      <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone} · {t(c.relation)}</p>
                      </div>
                      <button onClick={() => removeContact(i)} className="p-1.5 bg-white rounded-lg shadow-sm">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add new */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t("Add Contact")}</p>
                {[
                  { key: "name", placeholder: t("Full Name") },
                  { key: "phone", placeholder: t("Phone Number"), type: "tel" },
                  { key: "relation", placeholder: t("Relation (e.g. Father, Doctor)") },
                ].map((f: any) => (
                  <input
                    key={f.key}
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={(newContact as any)[f.key]}
                    onChange={e => setNewContact(p => ({ ...p, [f.key]: e.target.value }))}
                    className={cn("w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-gray-50", isPro ? "focus:border-emerald-500" : "focus:border-blue-500")}
                  />
                ))}
                <button
                  onClick={addContact}
                  disabled={!newContact.name || !newContact.phone}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 disabled:opacity-40 transition-colors"
                >
                  {t("Add Emergency Contact")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}

// ── Sub-components ──
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">{title}</p>
      <div className="glass rounded-2xl divide-y divide-gray-100/60 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({
  icon: Icon, label, sub, onClick, accent, isPro
}: {
  icon: any; label: string; sub?: string; onClick?: () => void; accent?: "red"; isPro?: boolean;
}) {
  const iconBg = accent === "red" ? "bg-red-50" : isPro ? "bg-emerald-50" : "bg-blue-50";
  const iconColor = accent === "red" ? "text-red-600" : isPro ? "text-emerald-600" : "text-blue-600";
  const labelColor = accent === "red" ? "text-red-700" : "text-gray-900";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 px-4 hover:bg-gray-50/70 transition-colors text-left"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
      <div className="flex-1">
        <p className={cn("text-sm font-semibold", labelColor)}>{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
    </button>
  );
}