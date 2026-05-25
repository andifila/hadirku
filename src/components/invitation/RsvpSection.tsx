"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { submitRsvp } from "@/lib/supabase/rsvp";
import { resolveTheme } from "./template-config";
import type { PublicInvitation } from "@/lib/supabase/public-invitation";

type RsvpState = "idle" | "submitting" | "done" | "error" | "already_submitted" | "rsvp_closed" | "rate_limited";

function ElegantField({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="py-4 transition-colors duration-200"
      style={{ borderBottom: `1px solid ${focused ? "var(--primary)" : "var(--border)"}` }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <label
        className="mb-1.5 block text-[9px] uppercase tracking-[0.25em] transition-colors duration-200"
        style={{ color: focused ? "var(--primary)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
      >
        {label}{required && <span style={{ color: "var(--primary)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export function RsvpSection({ invite, guestName, onSuccess }: {
  invite: PublicInvitation; guestName: string; onSuccess: () => void;
}) {
  const storageKey = `rsvp_${invite.id}`;
  const theme = resolveTheme(invite.template_slug, invite.primary_color);

  const [name,       setName]       = useState(guestName);
  const [phone,      setPhone]      = useState("");
  const [status,     setStatus]     = useState<"attending" | "not_attending">("attending");
  const [guestCount, setGuestCount] = useState(1);
  const [message,    setMessage]    = useState("");
  const [state,      setState]      = useState<RsvpState>("idle");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    try { if (localStorage.getItem(storageKey)) setState("already_submitted"); } catch { /* private mode */ }
    if (invite.rsvp_closes_at && new Date(invite.rsvp_closes_at) < new Date()) {
      setState("rsvp_closed");
    }
  }, [storageKey, invite.rsvp_closes_at]);

  function validatePhone(v: string): boolean {
    if (!v.trim()) return true;
    const digits = v.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!validatePhone(phone)) { setPhoneError("Nomor WhatsApp tidak valid."); return; }
    setPhoneError("");
    setState("submitting");
    setErrorMsg("");
    try {
      await submitRsvp({
        invitation_id: invite.id,
        name, phone, rsvp_status: status, message,
        guest_count: status === "attending" ? guestCount : undefined,
      });
      try { localStorage.setItem(storageKey, "1"); } catch { /* private mode */ }
      setState("done");
      onSuccess();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "ALREADY_SUBMITTED") setState("already_submitted");
      else if (code === "RSVP_CLOSED")  setState("rsvp_closed");
      else if (code === "RATE_LIMITED") setState("rate_limited");
      else {
        setErrorMsg("Terjadi kesalahan, silakan coba lagi.");
        setState("error");
      }
    }
  }

  const isDone = state === "done" || state === "already_submitted" || state === "rsvp_closed" || state === "rate_limited";

  return (
    <section className="px-6 py-20" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-sm">
        <div className="mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[9px] uppercase tracking-[0.4em]"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
          >
            Konfirmasi Kehadiran
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 font-bold"
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize:   "clamp(1.75rem, 7vw, 2.25rem)",
              lineHeight: 1.18,
            }}
          >
            Beri tahu kami<br />kehadiranmu
          </motion.h2>
        </div>

        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 py-8"
            >
              <CheckCircle className="h-8 w-8" style={{ color: "var(--primary)" }} />
              <div>
                <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
                  {state === "already_submitted" ? "Konfirmasi sudah diterima"
                    : state === "rsvp_closed"   ? "Konfirmasi ditutup"
                    : state === "rate_limited"   ? "Terlalu banyak permintaan"
                    : `Terima kasih, ${name}`}
                </p>
                <p className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  {state === "already_submitted"
                    ? "Anda sebelumnya telah mengisi konfirmasi kehadiran."
                    : state === "rsvp_closed"
                      ? "Batas waktu konfirmasi kehadiran telah berakhir."
                    : state === "rate_limited"
                      ? "Terlalu banyak konfirmasi dalam waktu singkat. Silakan coba lagi dalam beberapa menit."
                    : status === "attending"
                      ? `Kami menantikan kehadiran Anda${guestCount > 1 ? ` bersama ${guestCount} orang` : ""}.`
                      : "Terima kasih, konfirmasi berhasil dicatat."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="flex flex-col"
            >
              {/* Attendance toggle */}
              <div className="flex items-center gap-8 pb-7"
                style={{ borderBottom: "1px solid var(--border)" }}>
                {([
                  { val: "attending",     label: "Hadir" },
                  { val: "not_attending", label: "Tidak Hadir" },
                ] as const).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setStatus(opt.val)}
                    className="flex items-center gap-2.5"
                  >
                    <div
                      className="h-4 w-4 rounded-full border-2 transition-all duration-200"
                      style={{
                        borderColor: "var(--primary)",
                        background:  status === opt.val ? "var(--primary)" : "transparent",
                      }}
                    />
                    <span
                      className="text-sm transition-colors duration-200"
                      style={{
                        fontFamily: "var(--font-inter)",
                        color:      status === opt.val ? "var(--foreground)" : "var(--muted-foreground)",
                        fontWeight: status === opt.val ? 500 : 400,
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <ElegantField label="Nama" required>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda" required
                  className="w-full bg-transparent py-0.5 text-sm outline-none placeholder:opacity-40"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </ElegantField>

              {status === "attending" && (
                <div className="flex items-center justify-between py-5"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-[9px] uppercase tracking-[0.25em]"
                    style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    Jumlah Tamu
                  </p>
                  <div className="flex items-center gap-4">
                    <motion.button type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      whileTap={{ scale: 0.97 }}
                      className="flex h-11 w-11 items-center justify-center text-lg"
                      style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted-foreground)", background: "transparent" }}
                    >−</motion.button>
                    <span className="w-6 text-center text-base font-semibold"
                      style={{ fontFamily: "var(--font-playfair)" }}>
                      {guestCount}
                    </span>
                    <motion.button type="button"
                      onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                      whileTap={{ scale: 0.97 }}
                      className="flex h-11 w-11 items-center justify-center text-lg"
                      style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted-foreground)", background: "transparent" }}
                    >+</motion.button>
                  </div>
                </div>
              )}

              <ElegantField label="No. WhatsApp (opsional)">
                <input
                  type="tel" value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }}
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-transparent py-0.5 text-sm outline-none placeholder:opacity-40"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </ElegantField>
              {phoneError && (
                <p className="mt-1 text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>{phoneError}</p>
              )}

              <ElegantField label="Ucapan & Doa (opsional)">
                <textarea
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis ucapan atau doa untuk pasangan..."
                  rows={3}
                  className="w-full resize-none bg-transparent py-0.5 text-sm outline-none placeholder:opacity-40"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </ElegantField>

              {state === "error" && (
                <p className="mt-2 text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={state === "submitting" || !name.trim()}
                whileHover={state !== "submitting" && !!name.trim()
                  ? { scale: 1.02, boxShadow: `0 6px 24px -6px ${theme.primary}88` }
                  : undefined}
                whileTap={state !== "submitting" && !!name.trim() ? { scale: 0.97 } : undefined}
                transition={{ duration: 0.15 }}
                className="mt-8 flex w-full items-center justify-center py-4 text-[10px] uppercase tracking-[0.25em] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:   theme.gradient,
                  color:        "#fff",
                  fontFamily:   "var(--font-inter)",
                  borderRadius: 6,
                  boxShadow:    `0 4px 16px -6px ${theme.primary}44`,
                }}
              >
                {state === "submitting"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : "Kirim Konfirmasi"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
