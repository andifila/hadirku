"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Toast } from "@/components/ui/Toast";
import InvitationForm, { type FormValues } from "@/components/invitation/InvitationForm";
import { createInvitation, generateSlug } from "@/lib/supabase/invitation-crud";

export default function NewInvitationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState(false);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    setError("");
    const slug = values.slug.trim() || generateSlug(values.bride_name, values.groom_name);
    try {
      await createInvitation({
        template_id:        values.template_id,
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
        bank_accounts:      values.bank_accounts.length > 0 ? values.bank_accounts : null,
        gift_address:       values.gift_address.trim()       || null,
        owner_whatsapp:     values.owner_whatsapp.trim()     || null,
        slug,
        is_published: values.is_published,
      });
      setToast(true);
      setTimeout(() => router.push("/dashboard"), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat undangan.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col" style={{ background: "var(--muted)" }}>
      <main className="flex-1 overflow-y-auto">
        <motion.div
          className="mx-auto max-w-2xl px-4 py-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <InvitationForm
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            submitLabel="Buat Undangan"
          />
        </motion.div>
      </main>

      <Toast
        message="Undangan berhasil dibuat"
        visible={toast}
        onClose={() => setToast(false)}
      />
    </div>
  );
}
