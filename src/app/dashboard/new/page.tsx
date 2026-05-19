"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import InvitationForm, {
  type FormValues,
} from "@/components/invitation/InvitationForm";
import { createInvitation, generateSlug } from "@/lib/supabase/invitation-crud";

export default function NewInvitationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        is_published:       values.is_published,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal membuat undangan."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--muted)" }}>
      <nav
        className="sticky top-0 z-10 px-4 py-4"
        style={{
          background: "var(--background)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg p-2 transition-colors hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Buat Undangan Baru
          </h1>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border)",
          }}
        >
          <InvitationForm
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            submitLabel="Buat Undangan"
          />
        </div>
      </main>
    </div>
  );
}
