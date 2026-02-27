import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Search, Star, MapPin, Clock, Phone, Video, Calendar, CalendarCheck, ChevronRight, X, Check, IndianRupee, User, FileText, Pill, ShieldCheck, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";
import { useUser } from "@/contexts/UserContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";

const SPECIALTIES = ["All", "Cardiologist", "General Physician", "Neurologist", "Diabetologist", "Gynecologist", "Orthopedic"];

interface Doctor {
  id: number; name: string; specialty: string; experience: number; rating: number;
  reviews: number; description: string; fee: number; image: string; available: boolean;
  languages: string[]; hospital: string; city: string; availableSlots: string[];
}

interface Appointment {
  id: string; doctorId: number; doctorName: string; doctorSpecialty: string;
  doctorImage: string; slot: string; status: string; reason: string; doctorFee: number;
}

export default function Consultations() {
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const { t } = useStrictTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"doctors" | "appointments">("doctors");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [cancelId, setCancelId] = useState("");
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  const fetchDoctors = async (q = search, sp = specialty) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (sp && sp !== "All") params.set("specialty", sp);
      const res = await fetch(`/api/doctors?${params}`);
      const json = await res.json();
      if (!res.ok || json.error || json.success === false) {
        setDoctors([]);
        return;
      }
      const d = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      setDoctors(d);
    } catch { }
    setLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      const json = await res.json();
      if (!res.ok || json.error || json.success === false) {
        setAppointments([]);
        return;
      }
      const d = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      setAppointments(d);
    } catch { }
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    setBooking(true);
    try {
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id, slot: selectedSlot,
          userId: user.userId, userName: user.name, reason,
        }),
      });
      addNotification({ type: "appointment", title: t("Appointment Booked"), message: `${t("With")} ${selectedDoctor.name} ${t("on")} ${new Date(selectedSlot).toLocaleDateString()}` });
      setBookSuccess(true);
      fetchAppointments();
      setTimeout(() => { setSelectedDoctor(null); setBookSuccess(false); setSelectedSlot(""); setReason(""); }, 2000);
    } catch { }
    setBooking(false);
  };

  const handleCancel = async (id: string) => {
    try {
      await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      addNotification({ type: "info", title: t("Cancelled"), message: t("Appointment cancelled successfully") });
      setCancelId("");
    } catch { }
  };

  const handleSearch = (val: string) => { setSearch(val); fetchDoctors(val, specialty); };
  const handleSpecialty = (sp: string) => { setSpecialty(sp); fetchDoctors(search, sp); };

  return (
    <MobileLayout>
      <div className="animate-in fade-in duration-500">
        {/* Header */}
        <div className="mb-6 pt-2">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {t("Smarter Choices for")}<br />
            <span className="text-indigo-500">{t("Better Health")}</span>
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white border border-gray-100 text-sm focus:outline-none shadow-[0_4px_20px_rgb(0,0,0,0.04)]"
            placeholder={t("Search doctors, symptoms...")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-500 p-2 rounded-xl border border-indigo-600 shadow-sm text-white">
            <MapPin className="h-4 w-4" />
          </button>
        </div>

        {/* Horizontal Service Pills */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button className="flex-1 min-w-[100px] flex justify-center items-center gap-2 bg-indigo-600 text-white px-2 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-200 border border-indigo-600 pointer-events-none">
            <Calendar className="w-4 h-4" /> {t("Doctor")}
          </button>
          <a href="/info?tab=medicines" className="flex-1 min-w-[100px] flex justify-center items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-2 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm">
            <Pill className="w-4 h-4 text-indigo-500" /> {t("Medicine")}
          </a>
          <a href="/info?tab=hospitals" className="flex-1 min-w-[100px] flex justify-center items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-2 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm">
            <MapPin className="w-4 h-4 text-blue-500" /> {t("Hospital")}
          </a>
          <button onClick={() => setShowEmergency(true)} className="flex-1 min-w-[100px] flex justify-center items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-2 py-3 rounded-2xl text-xs font-bold transition-all">
            <Phone className="w-4 h-4" /> {t("Emergency")}
          </button>
        </div>

        {/* Tabs - Doctors vs Appointments */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 border-b border-gray-100 w-full mb-1">
            <button onClick={() => setTab("doctors")}
              className={cn("pb-2 text-sm font-bold transition-all border-b-2 relative top-[1px]", tab === "doctors" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400")}>
              {t("Expert Doctors")}
            </button>
            <button onClick={() => setTab("appointments")}
              className={cn("pb-2 text-sm font-bold transition-all border-b-2 relative top-[1px]", tab === "appointments" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400")}>
              {t("My Appointments")} ({appointments.length})
            </button>
          </div>
        </div>

        {tab === "doctors" && (
          <>
            {/* Specialty Filters */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
              {SPECIALTIES.map((sp) => (
                <button key={sp} onClick={() => handleSpecialty(sp)}
                  className={cn("shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                    specialty === sp ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-500 hover:bg-gray-100")}>
                  {t(sp)}
                </button>
              ))}
            </div>

            {/* Doctors List */}
            {loading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => (
                <div key={i} className="glass rounded-2xl p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-24 rounded-2xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-9 bg-gray-200 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}</div>
            ) : (
              <div className="space-y-4 pb-4">
                {doctors.map((doc, i) => (
                  <motion.div key={doc.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="glass rounded-2xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="relative">
                        <img src={doc.image} alt={doc.name} className="w-20 h-24 rounded-2xl object-cover" />
                        <span className={cn("absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white",
                          doc.available ? "bg-green-400" : "bg-gray-300")} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="font-bold text-gray-900 text-sm leading-tight">{doc.name}</h4>
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-amber-700">{doc.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 font-semibold">{t(doc.specialty)}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 mb-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{doc.experience}{t("yr exp")}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t(doc.city)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <IndianRupee className="w-3 h-3" />
                          <span className="font-semibold text-gray-800">₹{doc.fee}</span>
                          <span className="text-gray-400">{t("per consult")}</span>
                        </div>
                        <button
                          onClick={() => { setSelectedDoctor(doc); setSelectedSlot(""); setReason(""); }}
                          className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" /> {t("Book Appointment")}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{doc.description}</p>
                    <div className="flex gap-1 mt-2">
                      {doc.languages.map(l => (
                        <span key={l} className="bg-blue-50 text-blue-600 text-[10px] font-medium px-2 py-0.5 rounded-full">{l}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "appointments" && (
          <div className="space-y-3 pb-4">
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t("No appointments yet")}</p>
                <p className="text-sm">{t("Book one from the Doctors tab")}</p>
              </div>
            ) : appointments.map((appt) => (
              <motion.div key={appt.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4"
              >
                <div className="flex gap-3">
                  <img src={appt.doctorImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900">{appt.doctorName}</h4>
                    <p className="text-xs text-blue-600">{t(appt.doctorSpecialty)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(appt.slot).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {new Date(appt.slot).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {appt.reason && <p className="text-xs text-gray-500 mt-0.5">{appt.reason}</p>}
                  </div>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-xl h-fit">{t("Confirmed")}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://meet.jit.si/healthify-${appt.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    <Video className="w-3.5 h-3.5" /> {t("Start Call")}
                  </a>
                  <button
                    onClick={() => setCancelId(appt.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100"
                  >
                    <X className="w-3.5 h-3.5" /> {t("Cancel")}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Sheet */}
      <AnimatePresence>
        {selectedDoctor && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setSelectedDoctor(null)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-[70] p-6"
              style={{ maxHeight: "85vh", overflowY: "auto" }}
            >
              {bookSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{t("Appointment Booked!")}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t("You'll receive a confirmation shortly.")}</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 mb-5">
                    <img src={selectedDoctor.image} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedDoctor.name}</h3>
                      <p className="text-sm text-blue-600">{t(selectedDoctor.specialty)}</p>
                      <p className="text-xs text-gray-500">₹{selectedDoctor.fee} {t("consultation fee")}</p>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-700 mb-2">{t("Select Date & Time")}</h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {selectedDoctor.availableSlots.map((slot) => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)}
                        className={cn("py-2.5 px-3 rounded-xl text-xs font-medium text-left transition-all border",
                          selectedSlot === slot ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300")}>
                        <p className="font-semibold">{new Date(slot).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</p>
                        <p className="opacity-70">{new Date(slot).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm font-bold text-gray-700 mb-2">{t("Reason for Visit (optional)")}</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-blue-500"
                    rows={2} placeholder={t("Describe your symptoms or reason for appointment...")}
                    value={reason} onChange={(e) => setReason(e.target.value)}
                  />

                  <button
                    onClick={handleBook}
                    disabled={!selectedSlot || booking}
                    className={cn("w-full mt-4 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                      selectedSlot && !booking ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg" : "bg-gray-100 text-gray-400 cursor-not-allowed")}>
                    {booking ? t("Booking...") : t("Confirm Appointment")}
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel Confirm Dialog */}
      <ConfirmModal
        isOpen={!!cancelId}
        title={t("Cancel Appointment?")}
        description={t("Are you sure you want to cancel this booking? This action cannot be undone.")}
        confirmText={t("Cancel Booking")}
        cancelText={t("Keep")}
        danger={true}
        onConfirm={() => handleCancel(cancelId)}
        onCancel={() => setCancelId("")}
      />
      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergency && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEmergency(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-500 p-6 text-center relative">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{t("Emergency Contacts")}</h2>
                <p className="text-red-100 text-sm">{t("Tap any number to call immediately")}</p>
                <button onClick={() => setShowEmergency(false)} className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {/* Police */}
                <a href="tel:100" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all group active:scale-[0.98]">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-red-600">100</h3>
                    <p className="text-sm font-medium text-gray-600">{t("Police Control Room")}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t("For crimes and immediate security issues")}</p>
                  </div>
                </a>

                {/* Ambulance */}
                <a href="tel:108" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all group active:scale-[0.98]">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-500 transition-colors">
                    <Activity className="w-6 h-6 text-red-600 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-red-600 transition-colors">108</h3>
                    <p className="text-sm font-medium text-gray-600">{t("National Ambulance Service")}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t("For medical emergencies and accidents")}</p>
                  </div>
                </a>

                {/* National Emergency */}
                <a href="tel:112" className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all group active:scale-[0.98]">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-red-600">112</h3>
                    <p className="text-sm font-medium text-gray-600">{t("National Emergency Number")}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t("All-in-one emergency helpline")}</p>
                  </div>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}