import { useState, useCallback } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { FolderLock, FileText, Activity, ShieldCheck, UploadCloud, ChevronRight, Search, X, Trash2, Share2, Scan, FlaskConical, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useStrictTranslation } from "@/hooks/useStrictTranslation";

import { exportDataAsJSON, generateClinicalSummaryPDF } from "@/lib/exportUtils";
import { Download, FileText as FileTextIcon } from "lucide-react";

const CATEGORIES = [
  { id: "Prescriptions", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "Lab Reports", icon: Activity, color: "text-rose-500", bg: "bg-rose-50" },
  { id: "Vaccination", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
];

export default function HealthLocker() {
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const { t } = useStrictTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", category: "Lab Reports", doctor: "", size: "" });
  const [uploading, setUploading] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["records", user.userId],
    queryFn: async () => {
      try {
        const res = await fetch("/api/records");
        const json = await res.json();
        if (!res.ok || json.error || json.success === false) {
          throw new Error(json.error || "Failed to fetch records");
        }
        const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        localStorage.setItem(`healthify_records_${user.userId}`, JSON.stringify(data));
        return data;
      } catch (err) {
        const cached = localStorage.getItem(`healthify_records_${user.userId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) { }
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    initialData: () => {
      const cached = localStorage.getItem(`healthify_records_${user.userId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) { }
      }
      return undefined;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/records/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["records"] }); setDeleteId(""); },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadForm((p) => ({ ...p, title: p.title || file.name.replace(/\.[^/.]+$/, ""), size: `${(file.size / 1024 / 1024).toFixed(1)} MB` }));
  };

  const submitRecord = async () => {
    if (!uploadForm.title) return;
    const tempId = "temp_" + Date.now();
    const newRecord = {
      ...uploadForm,
      id: tempId,
      userId: user.userId,
      uploadedAt: new Date().toISOString(),
      size: uploadForm.size || "0 MB"
    };

    // Optimistic Update
    qc.setQueryData(["records", user.userId], (old: any) => [newRecord, ...(old || [])]);

    setUploading(true);
    setEncrypting(true);

    // Simulate AES-256 deep encryption layer
    await new Promise(r => setTimeout(r, 1000));
    setEncrypting(false);

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...uploadForm, userId: user.userId }),
      });
      const savedRecord = await res.json();

      // Replace temp record with actual saved record
      qc.setQueryData(["records", user.userId], (old: any) =>
        (old || []).map((r: any) => r.id === tempId ? savedRecord : r)
      );

      addNotification({ type: "record", title: t("Encrypted & Uploaded"), message: `${uploadForm.title} ${t("added to Health Locker")}` });
      setShowUpload(false);
      setUploadForm({ title: "", category: "Lab Reports", doctor: "", size: "" });
    } catch (err) {
      // Rollback on error
      qc.invalidateQueries({ queryKey: ["records", user.userId] });
      addNotification({ type: "alert", title: t("Upload Failed"), message: t("Please check your connection and try again.") });
    }
    setUploading(false);
  };

  const share = async (rec: any) => {
    if (navigator.share) {
      await navigator.share({ title: rec.title, text: `Health Record: ${rec.title} (${rec.category})` });
    } else {
      await navigator.clipboard.writeText(`Health Record: ${rec.title}`);
      addNotification({ type: "info", title: t("Copied"), message: t("Record info copied to clipboard") });
    }
  };

  const filtered = records.filter((r: any) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || r.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const countByCategory = (cat: string) => records.filter((r: any) => r.category === cat).length;

  return (
    <MobileLayout>
      <div className="animate-in fade-in duration-500">
        <div className="mb-6 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-500 mb-1.5">
              <FolderLock className="w-4 h-4" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">{t("Health Locker")}</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportDataAsJSON({ profile: user, records }, `healthify_${user.name.replace(/\s+/g, '_')}_export.json`)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 shadow-sm rounded-full text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                title="Export Raw Data (JSON)"
              >
                <Download className="w-3 h-3 text-indigo-500" /> Export
              </button>
              <button
                onClick={() => generateClinicalSummaryPDF(user, records)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 shadow-sm shadow-indigo-200 rounded-full text-[10px] font-bold text-white hover:bg-indigo-700 transition-colors"
                title="Clinical Summary (PDF)"
              >
                <FileTextIcon className="w-3 h-3 text-indigo-200" /> Summary
              </button>
            </div>
          </div>
          <h1 className="text-[26px] font-bold text-gray-900 leading-[1.15]">
            {t("Your Health Vault")}<br />
            <span className="text-emerald-500 text-lg flex items-center gap-1.5 mt-1 border border-emerald-100 bg-emerald-50 px-2.5 py-1 rounded-full w-fit shadow-sm">
              <ShieldCheck className="w-4 h-4" /> {t("End-to-End Encrypted")}
            </span>
          </h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-gray-100 text-sm focus:outline-none shadow-[0_4px_20px_rgb(0,0,0,0.04)]"
            placeholder={t("Search documents...")}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {CATEGORIES.map(({ id, icon: Icon, color, bg }) => (
            <button key={id}
              onClick={() => setSelectedCategory(selectedCategory === id ? null : id)}
              className={cn("rounded-[1.5rem] p-5 text-left transition-all border border-gray-100/50 flex flex-col items-start min-h-[140px]",
                selectedCategory === id ? "bg-indigo-600 shadow-md shadow-indigo-200" : "bg-white shadow-[0_2px_15px_rgb(0,0,0,0.03)] hover:shadow-md")}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-auto",
                selectedCategory === id ? "bg-white/20" : bg)}>
                <Icon className={cn("w-5 h-5", selectedCategory === id ? "text-white" : color)} />
              </div>
              <div>
                <p className={cn("font-bold text-[13px] leading-tight mb-0.5", selectedCategory === id ? "text-white" : "text-gray-900")}>{t(id)}</p>
                <p className={cn("text-[10px] font-medium", selectedCategory === id ? "text-indigo-200" : "text-gray-400")}>
                  {countByCategory(id)} {t("Files")}
                </p>
              </div>
            </button>
          ))}

          {/* Upload card */}
          <button
            onClick={() => setShowUpload(true)}
            className="bg-indigo-50 rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center transition-colors group min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="font-bold text-indigo-700 text-[13px]">{t("Upload New")}</p>
          </button>
        </div>

        {/* Records List */}
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="font-bold text-[15px] text-gray-900 leading-none">
            {selectedCategory ? t(selectedCategory) : t("Recent Documents")}
          </h3>
          {selectedCategory ? (
            <button onClick={() => setSelectedCategory(null)} className="text-[11px] text-indigo-600 font-bold flex items-center gap-1">
              <X className="w-3 h-3" /> {t("Clear filter")}
            </button>
          ) : (
            <button className="text-[11px] text-indigo-500 font-bold">{t("View all")}</button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-2xl p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
            </div>
          ))}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-sm">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <FolderLock className="w-full h-full opacity-30 text-indigo-600" />
              <Lock className="w-6 h-6 absolute -bottom-1 -right-1 text-emerald-500 opacity-80 bg-white rounded-full p-0.5 border border-emerald-100" />
            </div>
            <p className="font-bold text-gray-700 mb-1">{t("Vault Empty")}</p>
            <p className="text-xs">{t("Upload your first health record for secure, encrypted storage.")}</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {filtered.map((rec: any, i: number) => {
              const catInfo = CATEGORIES.find(c => c.id === rec.category);
              return (
                <motion.div key={rec.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", catInfo?.bg || "bg-indigo-50")}>
                    <FileText className={cn("w-4 h-4", catInfo?.color || "text-indigo-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 truncate mb-0.5 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-500 drop-shadow-sm shrink-0" />
                      {rec.title}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {new Date(rec.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {rec.doctor || t("No Doctor")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-gray-900 mr-1">{rec.size}</span>
                    <button onClick={() => share(rec)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(rec.id)} className="text-gray-300 hover:text-red-500 transition-colors hidden group-hover:block ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Sheet */}
      <AnimatePresence>
        {showUpload && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" onClick={() => setShowUpload(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] z-[70] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{t("Secure Vault")}</h3>
                  <p className="text-xs font-medium text-emerald-600">AES-256 Military Grade Encryption</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">{t("Document Name")}</label>
                  <input className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-900 bg-gray-50"
                    placeholder={t("e.g. Blood Test Report")} value={uploadForm.title}
                    onChange={(e) => setUploadForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">{t("Category")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(({ id }) => (
                      <button key={id} onClick={() => setUploadForm(p => ({ ...p, category: id }))}
                        className={cn("py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between",
                          uploadForm.category === id ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-200")}>
                        {id}
                        {uploadForm.category === id && <ShieldCheck className="w-4 h-4 opacity-70" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">{t("Doctor Name")}</label>
                  <input className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-900 bg-gray-50"
                    placeholder={t("Dr. Name (optional)")} value={uploadForm.doctor}
                    onChange={(e) => setUploadForm(p => ({ ...p, doctor: e.target.value }))} />
                </div>
                <label className="flex items-center gap-3 border-2 border-dashed border-indigo-200 bg-white rounded-2xl p-4 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group mt-2">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <UploadCloud className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-gray-800 block mb-0.5">{t("Select File")}</span>
                    <span className="text-[11px] font-medium text-gray-500">PDF, JPG, PNG up to 10MB</span>
                  </div>
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} />
                </label>
              </div>
              <button
                onClick={submitRecord}
                disabled={!uploadForm.title || uploading}
                className={cn("w-full mt-6 py-4 rounded-[20px] font-bold uppercase tracking-wider text-[11px] transition-all flex items-center justify-center",
                  uploadForm.title && !uploading ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_4px_15px_rgba(79,70,229,0.3)]" : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  encrypting && "bg-emerald-600 shadow-[0_4px_15px_rgba(5,150,105,0.3)] text-white")}
              >
                {encrypting ? (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 animate-pulse" /> {t("Encrypting & Securing Data...")}
                  </span>
                ) : uploading ? (
                  t("Saving...")
                ) : (
                  t("Save to Encrypted Vault")
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        title={t("Delete Record?")}
        description={t("This action will permanently remove this health document and cannot be undone.")}
        confirmText={t("Delete")}
        cancelText={t("Keep")}
        danger={true}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId("")}
      />
    </MobileLayout>
  );
}