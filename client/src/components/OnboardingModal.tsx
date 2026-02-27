import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";
import { useUser } from "@/contexts/UserContext";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import {
    ChevronRight, CheckCircle, Heart, Ruler, Weight, MapPin, User,
    ArrowRight, Stethoscope, Sparkles, Shield, Activity, Layout, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

/* ─── Data ─────────────────────────────────────────────────────────────── */
const COMMON_DISEASES = [
    "Diabetes", "Hypertension (High BP)", "Heart Disease", "Asthma",
    "Arthritis", "Thyroid Disorder", "Kidney Disease", "Anemia",
    "High Cholesterol", "Obesity", "COPD", "None / Healthy",
];

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−", "Don't Know"];

const ACTIVITY_LEVELS = [
    { id: "sedentary", label: "Sedentary", desc: "Little or no exercise", emoji: "🛋️" },
    { id: "light", label: "Light", desc: "Light exercise 1–3 days/wk", emoji: "🚶" },
    { id: "moderate", label: "Moderate", desc: "Moderate exercise 3–5 days/wk", emoji: "🏃" },
    { id: "active", label: "Very Active", desc: "Hard exercise 6–7 days/wk", emoji: "💪" },
];

/* ─── Welcome Splash ────────────────────────────────────────────────────── */
function WelcomeSplash({ onStart }: { onStart: () => void }) {
    const { t } = useStrictTranslation();
    const { languageCode, language, setLanguage } = useLanguage();
    const { updateUser } = useUser();
    const [showLangMenu, setShowLangMenu] = useState(false);
    return (
        <motion.div
            className="flex flex-col min-h-[100dvh] relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
            <div className="absolute inset-0">
                <div className="absolute top-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-white/8 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-indigo-400/10 blur-2xl" />
            </div>

            {/* Top brand and Language Selector */}
            <div className="relative z-10 pt-10 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center p-2">
                        <Logo className="text-white" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">Healthify</span>
                </div>

                {/* Language Selector Dropdown Button */}
                <div className="relative z-[70]">
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-white/10"
                    >
                        <Globe className="w-3.5 h-3.5" />
                        {language}
                        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showLangMenu ? "-rotate-90" : "rotate-90")} />
                    </button>
                </div>
            </div>

            {/* Language Dropdown Menu Container (Moved out of flow) */}
            <AnimatePresence>
                {showLangMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100]" onClick={() => setShowLangMenu(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute right-6 top-[88px] w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[110] flex flex-col"
                        >
                            <div className="flex-1 overflow-y-auto pointer-events-auto max-h-[40vh] py-2 custom-scrollbar overscroll-contain">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setLanguage(lang.code);
                                            if (updateUser) {
                                                updateUser({ language: lang.code } as any);
                                            }
                                            setShowLangMenu(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-[15px] font-medium transition-colors hover:bg-blue-50 flex items-center justify-between",
                                            languageCode === lang.code ? "text-blue-600 bg-blue-50/50" : "text-gray-700"
                                        )}
                                    >
                                        <span>{lang.native} <span className="text-gray-400 text-xs ml-1">({lang.name})</span></span>
                                        {languageCode === lang.code && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Doctor illustration area */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
                {/* Floating card behind doctor */}
                <div className="relative w-full max-w-xs flex items-center justify-center">

                    {/* Animated floating stats */}
                    <motion.div
                        animate={{ y: [-6, 6, -6] }}
                        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                        className="absolute top-10 left-0 bg-white rounded-2xl px-3 py-2 shadow-xl flex items-center gap-2 z-20"
                    >
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                            <Activity className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-medium">{t("Health Score")}</p>
                            <p className="text-sm font-bold text-green-600">98 / 100</p>
                        </div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [6, -6, 6] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                        className="absolute bottom-10 right-0 bg-white rounded-2xl px-3 py-2 shadow-xl flex items-center gap-2 z-20"
                    >
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-medium">{t("AI Powered")}</p>
                            <p className="text-sm font-bold text-blue-600">{t("24/7 Care")}</p>
                        </div>
                    </motion.div>

                    {/* Doctor image container - transparent background blending in */}
                    <div className="relative mx-auto w-64 h-64 flex items-end justify-center mix-blend-multiply">
                        <img
                            src="/doctor.png"
                            alt="Healthify Doctor"
                            className="relative z-10 max-w-full max-h-full object-contain drop-shadow-2xl"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom content */}
            <div className="relative z-10 px-6 pb-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h1 className="text-3xl font-bold text-white text-center leading-tight mb-2">
                        {t("Smarter")}<br />{t("Healthcare for You")}
                    </h1>
                    <p className="text-blue-200 text-center text-sm leading-relaxed mb-8">
                        {t("AI-powered health guidance, video consultations, and personal health records — all in one place, in your language.")}
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2 justify-center mb-8">
                        {[`🤖 ${t("AI Symptom Checker")}`, `📋 ${t("Health Records")}`, `👨‍⚕️ ${t("Video Consults")}`, `💊 ${t("Medicine Info")}`].map((f) => (
                            <span key={f} className="bg-white/15 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
                                {f}
                            </span>
                        ))}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={onStart}
                        className="w-full bg-white text-blue-700 font-bold text-base py-5 rounded-3xl flex items-center justify-center gap-2 shadow-2xl shadow-blue-900/50"
                    >
                        {t("Get Started")} <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    <p className="text-blue-300 text-center text-xs mt-4">
                        {t("No account needed · All data stored on your device")}
                    </p>
                </motion.div>
            </div>
        </motion.div >
    );
}

/* ─── Setup Flow ────────────────────────────────────────────────────────── */
interface SetupForm {
    name: string; age: string; gender: string; address: string;
    height: string; weight: string; bloodGroup: string; activityLevel: string;
    diseases: string[];
    smokingStatus: string; alcoholStatus: string;
    appMode: "beginner" | "advanced";
    acknowledgedDisclaimer: boolean;
}

const INITIAL_FORM: SetupForm = {
    name: "", age: "", gender: "", address: "",
    height: "", weight: "", bloodGroup: "", activityLevel: "",
    diseases: [],
    smokingStatus: "never", alcoholStatus: "never",
    appMode: "beginner",
    acknowledgedDisclaimer: false,
};

function ProgressDots({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5 justify-center">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "rounded-full transition-all duration-300",
                        i === current ? "w-6 h-2 bg-blue-600" : i < current ? "w-2 h-2 bg-blue-400" : "w-2 h-2 bg-gray-200"
                    )}
                />
            ))}
        </div>
    );
}

function SetupFlow({ onDone }: { onDone: (form: SetupForm) => void }) {
    const { t } = useStrictTranslation();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<SetupForm>(INITIAL_FORM);
    const [direction, setDirection] = useState(1);

    const STEPS = [
        { title: t("What's your name?"), subtitle: t("Let's get acquainted 👋"), icon: User },
        { title: t("Personal Details"), subtitle: t("Helps us personalise your experience"), icon: User },
        { title: t("Body Measurements"), subtitle: t("For accurate health metrics & BMI"), icon: Ruler },
        { title: t("Health Conditions"), subtitle: t("Select any that apply to you"), icon: Heart },
        { title: t("Lifestyle & Activity"), subtitle: t("Almost done! One last step"), icon: Sparkles },
        { title: t("Choose Experience"), subtitle: t("Select how you want to use Healthify"), icon: Layout },
    ];

    const set = (key: keyof SetupForm, val: any) => setForm((p) => ({ ...p, [key]: val }));

    const toggleDisease = (d: string) => {
        if (d === "None / Healthy") {
            set("diseases", form.diseases.includes("None / Healthy") ? [] : ["None / Healthy"]);
            return;
        }
        set("diseases",
            form.diseases.includes(d)
                ? form.diseases.filter((x) => x !== d)
                : [...form.diseases.filter((x) => x !== "None / Healthy"), d]
        );
    };

    const canNext = () => {
        if (step === 0) return form.name.trim().length >= 2;
        if (step === 1) return !!form.age && !!form.gender;
        if (step === STEPS.length - 1) return form.acknowledgedDisclaimer;
        return true;
    };

    const next = () => { setDirection(1); setStep((s) => s + 1); };
    const back = () => { setDirection(-1); setStep((s) => s - 1); };
    const finish = () => onDone(form);

    const variants = {
        enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
        center: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
    };

    const bmi = form.height && form.weight
        ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
        : null;

    return (
        <>
            <div className="flex flex-col min-h-[100dvh] bg-white">
                {/* Header bar */}
                <div className="px-5 pt-12 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={step > 0 ? back : undefined}
                            className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                step > 0 ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "opacity-0 pointer-events-none")}
                        >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <ProgressDots current={step} total={STEPS.length} />
                        <span className="text-xs text-gray-400 font-medium w-10 text-right">
                            {step + 1}/{STEPS.length}
                        </span>
                    </div>

                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={`header-${step}`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{STEPS[step].title}</h2>
                            <p className="text-sm text-gray-500">{STEPS[step].subtitle}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-48">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={`step-${step}`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                            {/* ── Step 0: Name ── */}
                            {step === 0 && (
                                <div className="mt-4">
                                    <div className="relative">
                                        <input
                                            autoFocus
                                            className="w-full text-2xl font-bold text-gray-900 border-0 border-b-2 border-gray-200 focus:border-blue-600 focus:outline-none pb-2 bg-transparent placeholder-gray-300 transition-colors"
                                            placeholder={t("Your full name...")}
                                            value={form.name}
                                            onChange={(e) => set("name", e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && canNext() && next()}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">{t("This is how we'll greet you in the app")}</p>

                                    {form.name.trim().length >= 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="mt-8 bg-blue-50 rounded-3xl p-5 text-center"
                                        >
                                            <div className="text-4xl mb-2">👋</div>
                                            <p className="font-bold text-gray-900 text-lg">{t("Nice to meet you,")}</p>
                                            <p className="text-blue-600 font-bold text-xl">{form.name.trim()}!</p>
                                            <p className="text-gray-500 text-sm mt-1">{t("Let's set up your health profile")}</p>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 1: Personal Details ── */}
                            {step === 1 && (
                                <div className="space-y-6 mt-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">{t("Age")}</label>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => set("age", Math.max(1, (parseInt(form.age) || 18) - 1).toString())}
                                                className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 font-bold text-xl hover:bg-gray-200 transition-colors flex items-center justify-center">−</button>
                                            <div className="flex-1 text-center">
                                                <input
                                                    type="number" min="1" max="120"
                                                    className="text-5xl font-bold text-blue-600 w-full text-center bg-transparent border-0 focus:outline-none"
                                                    value={form.age}
                                                    onChange={(e) => set("age", e.target.value)}
                                                />
                                                <p className="text-xs text-gray-400 mt-1">{t("years old")}</p>
                                            </div>
                                            <button onClick={() => set("age", (Math.min(120, (parseInt(form.age) || 18) + 1)).toString())}
                                                className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-xl hover:bg-blue-700 transition-colors flex items-center justify-center">+</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">{t("Gender")}</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: "male", emoji: "👨", label: "Male" },
                                                { id: "female", emoji: "👩", label: "Female" },
                                                { id: "other", emoji: "🧑", label: "Other" },
                                            ].map((g) => (
                                                <button key={g.id} onClick={() => set("gender", g.id)}
                                                    className={cn("py-4 rounded-2xl font-semibold text-sm flex flex-col items-center gap-1 transition-all border-2",
                                                        form.gender === g.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200")}>
                                                    <span className="text-2xl">{g.emoji}</span>
                                                    {t(g.label)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{t("Location / Village")}</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                            <input
                                                className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-blue-400 bg-gray-50 transition-colors"
                                                placeholder={t("Village, District, State")}
                                                value={form.address}
                                                onChange={(e) => set("address", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 2: Body Measurements ── */}
                            {step === 2 && (
                                <div className="space-y-5 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 rounded-2xl p-4">
                                            <label className="text-xs font-bold text-blue-500 uppercase mb-2 block">{t("Height (cm)")}</label>
                                            <input
                                                type="number" min="50" max="250"
                                                className="w-full text-3xl font-bold text-blue-700 bg-transparent border-0 focus:outline-none"
                                                placeholder="165"
                                                value={form.height}
                                                onChange={(e) => set("height", e.target.value)}
                                            />
                                            <p className="text-xs text-blue-400 mt-1">{t("centimetres")}</p>
                                        </div>
                                        <div className="bg-violet-50 rounded-2xl p-4">
                                            <label className="text-xs font-bold text-violet-500 uppercase mb-2 block">{t("Weight (kg)")}</label>
                                            <input
                                                type="number" min="10" max="300"
                                                className="w-full text-3xl font-bold text-violet-700 bg-transparent border-0 focus:outline-none"
                                                placeholder="65"
                                                value={form.weight}
                                                onChange={(e) => set("weight", e.target.value)}
                                            />
                                            <p className="text-xs text-violet-400 mt-1">{t("kilograms")}</p>
                                        </div>
                                    </div>

                                    {bmi && (
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                            className={cn("rounded-2xl p-4 text-center",
                                                parseFloat(bmi) < 18.5 ? "bg-blue-50" :
                                                    parseFloat(bmi) < 25 ? "bg-green-50" :
                                                        parseFloat(bmi) < 30 ? "bg-amber-50" : "bg-red-50")}>
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t("Your BMI")}</p>
                                            <p className={cn("text-5xl font-bold",
                                                parseFloat(bmi) < 18.5 ? "text-blue-600" :
                                                    parseFloat(bmi) < 25 ? "text-green-600" :
                                                        parseFloat(bmi) < 30 ? "text-amber-600" : "text-red-600")}>{bmi}</p>
                                            <p className={cn("text-sm font-semibold mt-1",
                                                parseFloat(bmi) < 18.5 ? "text-blue-500" :
                                                    parseFloat(bmi) < 25 ? "text-green-500" :
                                                        parseFloat(bmi) < 30 ? "text-amber-500" : "text-red-500")}>
                                                {parseFloat(bmi) < 18.5 ? t("Underweight") : parseFloat(bmi) < 25 ? t("Normal Weight ✓") : parseFloat(bmi) < 30 ? t("Overweight") : t("Obese")}
                                            </p>
                                        </motion.div>
                                    )}

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{t("Blood Group")}</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {BLOOD_GROUPS.map((g) => (
                                                <button key={g} onClick={() => set("bloodGroup", g)}
                                                    className={cn("py-2.5 rounded-xl text-xs font-bold transition-all",
                                                        form.bloodGroup === g ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                                                    {t(g)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3: Health Conditions ── */}
                            {step === 3 && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-4">
                                        {t("This helps our AI give you personalized health recommendations and risk alerts.")}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_DISEASES.map((d) => {
                                            const selected = form.diseases.includes(d);
                                            return (
                                                <button key={d} onClick={() => toggleDisease(d)}
                                                    className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border-2",
                                                        selected ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-gray-50 text-gray-600 border-gray-100 hover:border-blue-200")}>
                                                    {selected && <CheckCircle className="w-3.5 h-3.5" />}
                                                    {t(d)}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {form.diseases.length > 0 && !form.diseases.includes("None / Healthy") && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                            <p className="text-xs font-bold text-amber-700">💡 {t("Personalization enabled for:")} {form.diseases.join(", ")}</p>
                                            <p className="text-xs text-amber-600 mt-0.5">{t("Our AI will give you tailored advice for these conditions.")}</p>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* ── Step 4: Lifestyle & Language ── */}
                            {step === 4 && (
                                <div className="space-y-6 mt-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">{t("Activity Level")}</label>
                                        <div className="space-y-2">
                                            {ACTIVITY_LEVELS.map((a) => (
                                                <button key={a.id} onClick={() => set("activityLevel", a.id)}
                                                    className={cn("w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all border-2 text-left",
                                                        form.activityLevel === a.id ? "border-blue-600 bg-blue-50" : "border-gray-100 bg-gray-50 hover:border-gray-200")}>
                                                    <span className="text-2xl">{a.emoji}</span>
                                                    <div className="flex-1">
                                                        <p className={cn("font-bold text-sm", form.activityLevel === a.id ? "text-blue-700" : "text-gray-800")}>{t(a.label)}</p>
                                                        <p className="text-xs text-gray-500">{t(a.desc)}</p>
                                                    </div>
                                                    {form.activityLevel === a.id && <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* ── Step 5: App Mode ── */}
                            {step === 5 && (
                                <div className="space-y-4 mt-4">
                                    <button onClick={() => set("appMode", "beginner")}
                                        className={cn("w-full text-left p-5 rounded-2xl border-2 transition-all",
                                            form.appMode === "beginner" ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100" : "border-gray-100 bg-white hover:border-gray-200")}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-[15px] mb-1">{t("Beginner Mode")}</h4>
                                                <p className="text-gray-500 text-xs leading-relaxed">{t("Simple, straightforward dashboard with essential healthcare features like AI Chat, Records, and Consultations.")}</p>
                                            </div>
                                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5", form.appMode === "beginner" ? "border-blue-600" : "border-gray-200")}>
                                                {form.appMode === "beginner" && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                            </div>
                                        </div>
                                    </button>

                                    <button onClick={() => set("appMode", "advanced")}
                                        className={cn("w-full text-left p-5 rounded-2xl border-2 transition-all",
                                            form.appMode === "advanced" ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100" : "border-gray-100 bg-white hover:border-gray-200")}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-[15px] flex items-center gap-1.5 mb-1">
                                                    {t("Advanced Mode")} <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                                </h4>
                                                <p className="text-gray-500 text-xs leading-relaxed">{t("Enhanced predictive AI ecosystem, disease radar, hyperlocal alerts, and comprehensive medical insights.")}</p>
                                            </div>
                                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5", form.appMode === "advanced" ? "border-blue-600" : "border-gray-200")}>
                                                {form.appMode === "advanced" && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* CTA Button */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-5 pb-8 pt-8 pointer-events-none">
                    <div className="pointer-events-auto">
                        {step === STEPS.length - 1 && (
                            <div className="mb-4 flex items-start gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                                <input
                                    type="checkbox"
                                    id="disclaimer"
                                    className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-red-200 accent-blue-600 shrink-0 cursor-pointer"
                                    checked={form.acknowledgedDisclaimer}
                                    onChange={(e) => set("acknowledgedDisclaimer", e.target.checked)}
                                />
                                <label htmlFor="disclaimer" className="text-[11px] text-red-800 leading-relaxed font-medium cursor-pointer">
                                    <span className="font-bold">{t("Medical Disclaimer:")}</span> {t("This app provides AI-driven health insights, not professional medical advice. Always consult a certified doctor before making medical decisions.")}
                                </label>
                            </div>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={step === STEPS.length - 1 ? finish : next}
                            disabled={!canNext()}
                            className={cn(
                                "w-full py-5 rounded-3xl font-bold text-base flex items-center justify-center gap-2 transition-all",
                                canNext()
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {step === STEPS.length - 1 ? (
                                <><Stethoscope className="w-5 h-5" /> {t("Start My Health Journey")}</>
                            ) : (
                                <>{t("Continue")} <ChevronRight className="w-5 h-5" /></>
                            )}
                        </motion.button>

                        {step === STEPS.length - 1 && (
                            <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
                                {t("By continuing, you agree that all data is stored locally on your device. No cloud account needed.")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
/* ─── Main Export ───────────────────────────────────────────────────────── */
export function OnboardingModal() {
    const { completeOnboarding } = useUser();
    const { setLanguage } = useLanguage();
    const [phase, setPhase] = useState<"splash" | "setup">("splash");

    const handleDone = (form: SetupForm) => {
        completeOnboarding({
            name: form.name.trim() || "User",
            age: parseInt(form.age) || 25,
            gender: form.gender as "male" | "female" | "other",
            address: form.address,
            height: parseFloat(form.height) || 0,
            weight: parseFloat(form.weight) || 0,
            diseases: form.diseases,
            appMode: form.appMode,
            // Store extra lifestyle data
            ...({ activityLevel: form.activityLevel, bloodGroup: form.bloodGroup } as any),
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
            <div className="w-full h-full relative flex flex-col">
                <AnimatePresence mode="wait">

                    {phase === "splash" ? (
                        <motion.div key="splash" className="h-full flex-1 w-full">
                            <WelcomeSplash onStart={() => setPhase("setup")} />
                        </motion.div>
                    ) : (
                        <motion.div key="setup" className="h-full flex-1 w-full"
                            initial={{ opacity: 0, x: "100%" }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}>
                            <SetupFlow onDone={handleDone} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
