"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import InvitationForm, {
  type FormValues,
} from "@/components/invitation/InvitationForm";
import {
  getInvitationById,
  updateInvitation,
} from "@/lib/supabase/invitation-crud";

export default function EditInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "var(--primary)" }}
          />
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
  const id = params.get("id") ?? "";

  const [initial, setInitial] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
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
          bank_accounts:      inv.bank_accounts      ?? [],
          gift_address:       inv.gift_address       ?? "",
          owner_whatsapp:     inv.owner_whatsapp     ?? "",
          slug:               inv.slug,
          is_published:       inv.is_published,
        });
      }
      setLoading(false);
    });
  }, [id]);

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
        bank_accounts:      values.bank_accounts.length > 0 ? values.bank_accounts : null,
        gift_address:       values.gift_address.trim()       || null,
        owner_whatsapp:     values.owner_whatsapp.trim()     || null,
        is_published:       values.is_published,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "var(--primary)" }}
        />
      </div>
    );
  }

  if (!id || !initial) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p style={{ fontFamily: "var(--font-inter)" }}>
          Undangan tidak ditemukan.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm underline"
          style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}
        >
          Kembali ke dashboard
        </button>
      </div>
    );
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
            Edit Undangan
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
            initial={initial}
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            submitLabel="Simpan Perubahan"
          />
        </div>
      </main>
    </div>
  );
}
