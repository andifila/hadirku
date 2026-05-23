"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2, FileText } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import InvitationForm, { type FormValues } from "@/components/invitation/InvitationForm";
import {
  getInvitationById,
  updateInvitation,
  deleteInvitation,
} from "@/lib/supabase/invitation-crud";

export default function EditInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center" style={{ background: "var(--muted)" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      }
    >
      <EditContent />
    </Suspense>
  );
}

function EditContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.get("id") ?? "";

  const [initial,           setInitial]           = useState<FormValues | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [submitting,        setSubmitting]        = useState(false);
  const [error,             setError]             = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,          setDeleting]          = useState(false);
  const [toast,             setToast]             = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getInvitationById(id).then((inv) => {
      if (inv) {
        setInitial({
          template_id:        inv.template_id,
          bride_name:         inv.bride_name,
          bride_title:        inv.bride_title        ?? "",
          bride_father_name:  inv.bride_father_name  ?? "",
          bride_mother_name:  inv.bride_mother_name  ?? "",
          bride_instagram:    inv.bride_instagram    ?? "",
          groom_name:         inv.groom_name,
          groom_title:        inv.groom_title        ?? "",
          groom_father_name:  inv.groom_father_name  ?? "",
          groom_mother_name:  inv.groom_mother_name  ?? "",
          groom_instagram:    inv.groom_instagram    ?? "",
          event_date:         inv.event_date,
          event_time:         inv.event_time,
          venue_name:         inv.venue_name,
          venue_address:      inv.venue_address,
          akad_date:          inv.akad_date          ?? "",
          akad_time:          inv.akad_time          ?? "08:00",
          akad_venue_name:    inv.akad_venue_name    ?? "",
          akad_venue_address: inv.akad_venue_address ?? "",
          dresscode:          inv.dresscode          ?? "",
          custom_message:     inv.custom_message     ?? "",
          cover_image_url:    inv.cover_image_url    ?? "",
          music_url:          inv.music_url          ?? "",
          gallery_url_1:      inv.gallery_url_1      ?? "",
          gallery_url_2:      inv.gallery_url_2      ?? "",
          gallery_url_3:      inv.gallery_url_3      ?? "",
          gallery_url_4:      inv.gallery_url_4      ?? "",
          gallery_url_5:      inv.gallery_url_5      ?? "",
          gallery_url_6:      inv.gallery_url_6      ?? "",
          bank_accounts:      inv.bank_accounts      ?? [],
          gift_address:       inv.gift_address       ?? "",
          owner_whatsapp:     inv.owner_whatsapp     ?? "",
          timezone:           inv.timezone           ?? "WIB",
          rsvp_closes_at:     inv.rsvp_closes_at     ?? "",
          primary_color:      inv.primary_color      ?? "",
          slug:               inv.slug,
          is_published:       inv.is_published,
        });
      }
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteInvitation(id);
      router.push("/dashboard");
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    setError("");
    try {
      await updateInvitation(id, {
        template_id:        values.template_id,
        slug:               values.slug.trim(),
        bride_name:         values.bride_name.trim(),
        bride_title:        values.bride_title.trim()        || null,
        bride_father_name:  values.bride_father_name.trim()  || null,
        bride_mother_name:  values.bride_mother_name.trim()  || null,
        bride_instagram:    values.bride_instagram.trim()    || null,
        groom_name:         values.groom_name.trim(),
        groom_title:        values.groom_title.trim()        || null,
        groom_father_name:  values.groom_father_name.trim()  || null,
        groom_mother_name:  values.groom_mother_name.trim()  || null,
        groom_instagram:    values.groom_instagram.trim()    || null,
        event_date:         values.event_date,
        event_time:         values.event_time,
        venue_name:         values.venue_name.trim(),
        venue_address:      values.venue_address.trim(),
        akad_date:          values.akad_date.trim()          || null,
        akad_time:          values.akad_date.trim() ? values.akad_time : null,
        akad_venue_name:    values.akad_venue_name.trim()    || null,
        akad_venue_address: values.akad_venue_address.trim() || null,
        dresscode:          values.dresscode.trim()          || null,
        custom_message:     values.custom_message.trim()     || null,
        cover_image_url:    values.cover_image_url.trim()    || null,
        music_url:          values.music_url.trim()          || null,
        gallery_url_1:      values.gallery_url_1.trim()      || null,
        gallery_url_2:      values.gallery_url_2.trim()      || null,
        gallery_url_3:      values.gallery_url_3.trim()      || null,
        gallery_url_4:      values.gallery_url_4.trim()      || null,
        gallery_url_5:      values.gallery_url_5.trim()      || null,
        gallery_url_6:      values.gallery_url_6.trim()      || null,
        bank_accounts:      values.bank_accounts.length > 0 ? values.bank_accounts : null,
        gift_address:       values.gift_address.trim()       || null,
        owner_whatsapp:     values.owner_whatsapp.trim()     || null,
        timezone:           values.timezone || "WIB",
        rsvp_closes_at:     values.rsvp_closes_at.trim()     || null,
        primary_color:      values.primary_color.trim()      || null,
        is_published:       values.is_published,
      });
      setToast(true);
      setTimeout(() => router.push("/dashboard"), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col" style={{ background: "var(--muted)" }}>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
              </div>

            ) : !id || !initial ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl px-6 py-24 text-center"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <FileText className="mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                  Undangan tidak ditemukan.
                </p>
              </motion.div>

            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <InvitationForm
                  initial={initial}
                  submitting={submitting}
                  error={error}
                  onSubmit={handleSubmit}
                  submitLabel="Simpan Perubahan"
                />

                {/* Danger zone */}
                <div
                  className="mt-8 rounded-2xl p-5"
                  style={{ border: "1px solid #fecaca", background: "#fef2f2" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                    Zona Berbahaya
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "#b91c1c", fontFamily: "var(--font-inter)" }}>
                    Menghapus undangan akan menghapus semua data tamu secara permanen.
                  </p>
                  <AnimatePresence mode="wait">
                    {!showDeleteConfirm ? (
                      <motion.button
                        key="btn"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                        style={{ background: "#dc2626", color: "#fff", fontFamily: "var(--font-inter)" }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus Undangan
                      </motion.button>
                    ) : (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-4 flex flex-wrap items-center gap-2"
                      >
                        <span className="text-sm" style={{ color: "#7f1d1d", fontFamily: "var(--font-inter)" }}>
                          Yakin ingin menghapus?
                        </span>
                        <motion.button
                          onClick={handleDelete}
                          disabled={deleting}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
                          style={{ background: "#dc2626", color: "#fff", fontFamily: "var(--font-inter)" }}
                        >
                          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Ya, Hapus
                        </motion.button>
                        <motion.button
                          onClick={() => setShowDeleteConfirm(false)}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          className="rounded-xl px-4 py-2 text-sm font-medium"
                          style={{ background: "var(--background)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                        >
                          Batal
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
      </main>

      <Toast
        message="Undangan berhasil disimpan"
        visible={toast}
        onClose={() => setToast(false)}
      />
    </div>
  );
}
