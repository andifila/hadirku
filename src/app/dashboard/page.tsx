"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, ExternalLink, Loader2,
  Link2, Check, Menu, Users, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserInvitations, type InvitationStat } from "@/lib/supabase/invitations";
import { getInvitationById, type Invitation } from "@/lib/supabase/invitation-crud";
import { Sidebar } from "@/components/dashboard/Sidebar";

const MotionLink = motion(Link);

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation,   setInvitation]   = useState<Invitation | null>(null);
  const [stat,         setStat]         = useState<InvitationStat | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [linkCopied,   setLinkCopied]   = useState(false);

  const load = useCallback(async () => {
    try {
      const stats = await getUserInvitations();
      if (!stats.length) return;
      const first = stats[0];
      setInvitationId(first.invitation_id);
      setStat(first);
      const inv = await getInvitationById(first.invitation_id);
      setInvitation(inv);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const attending    = stat?.attending    ?? 0;
  const notAttending = stat?.not_attending ?? 0;
  const pending      = stat?.pending      ?? 0;
  const totalGuests  = stat?.total_guests ?? 0;

  const daysUntil = invitation ? getDaysUntil(invitation.event_date) : null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--muted)" }}>

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar userEmail={user?.email ?? ""} onSignOut={signOut} invitationId={invitationId} />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar
                userEmail={user?.email ?? ""}
                onSignOut={signOut}
                onClose={() => setSidebarOpen(false)}
                invitationId={invitationId}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Content Area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header
          className="flex flex-shrink-0 items-center gap-3 px-5 py-3.5"
          style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
        >
          <motion.button
            onClick={() => setSidebarOpen(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9, rotate: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="rounded-lg p-2 lg:hidden"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          <div className="flex-1">
            <h1 className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
              Dashboard
            </h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              Ringkasan undangan &amp; statistik tamu
            </p>
          </div>

        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6">

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
              </div>

            ) : !invitation ? (
              /* ── Empty state ── */
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl px-6 py-24 text-center"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "var(--muted)" }}
                >
                  <Calendar className="h-7 w-7" style={{ color: "var(--primary)" }} />
                </div>
                <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
                  Belum ada undangan
                </h2>
                <p
                  className="mt-2 max-w-xs text-sm"
                  style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                >
                  Buat undangan pernikahan digital dan bagikan ke tamu lewat WhatsApp.
                </p>
                <MotionLink
                  href="/dashboard/new"
                  whileHover={{ scale: 1.03, boxShadow: "0 4px 18px rgba(176,141,87,0.38)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="mt-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
                  style={{
                    background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
                    color: "var(--primary-foreground)",
                    fontFamily: "var(--font-inter)",
                    boxShadow: "0 2px 8px rgba(176,141,87,0.2)",
                  }}
                >
                  Buat Undangan
                </MotionLink>
              </motion.div>

            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >

                {/* ── Invitation Hero ── */}
                <div className="relative overflow-hidden rounded-2xl">
                  {invitation.cover_image_url ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${invitation.cover_image_url})` }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.74) 100%)" }}
                      />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(135deg, #b08d57 0%, #7a5c34 100%)" }}
                    />
                  )}

                  <div className="relative px-6 pb-6 pt-6">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: invitation.is_published ? "rgba(22,163,74,0.25)" : "rgba(255,255,255,0.2)",
                        color: invitation.is_published ? "#86efac" : "rgba(255,255,255,0.9)",
                        border: `1px solid ${invitation.is_published ? "rgba(22,163,74,0.5)" : "rgba(255,255,255,0.3)"}`,
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: invitation.is_published ? "#86efac" : "rgba(255,255,255,0.9)" }}
                      />
                      {invitation.is_published ? "Dipublikasikan" : "Draft"}
                    </span>

                    <h1
                      className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      {invitation.bride_name}
                      <span className="mx-3 opacity-60">&amp;</span>
                      {invitation.groom_name}
                    </h1>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        {formatDate(invitation.event_date)}
                      </span>
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {invitation.venue_name}
                      </span>
                    </div>

                    {daysUntil !== null && (
                      <div className="mt-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            background: daysUntil > 0
                              ? "rgba(255,255,255,0.15)"
                              : daysUntil === 0
                                ? "rgba(251,191,36,0.3)"
                                : "rgba(255,255,255,0.1)",
                            color: daysUntil === 0 ? "#fbbf24" : "rgba(255,255,255,0.9)",
                            border: `1px solid ${daysUntil === 0 ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.2)"}`,
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {daysUntil > 0
                            ? `⏳ ${daysUntil} hari lagi`
                            : daysUntil === 0
                              ? "🎉 Hari ini!"
                              : "✨ Acara sudah berlangsung"}
                        </span>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <motion.a
                        href={`/invite/?s=${invitation.slug}${!invitation.is_published ? "&preview=1" : ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.26)" }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium"
                        style={{
                          background: "rgba(255,255,255,0.18)",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.3)",
                          backdropFilter: "blur(6px)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Lihat Undangan
                      </motion.a>
                      <motion.button
                        onClick={() => {
                          const link = getShareLink(invitation.slug);
                          navigator.clipboard.writeText(link).catch(() => {
                            const el = document.createElement("textarea");
                            el.value = link;
                            el.style.position = "fixed";
                            el.style.opacity = "0";
                            document.body.appendChild(el);
                            el.select();
                            document.execCommand("copy");
                            document.body.removeChild(el);
                          });
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center rounded-xl px-4 py-2 text-xs font-medium"
                        style={{
                          background: linkCopied ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.12)",
                          color: linkCopied ? "#86efac" : "rgba(255,255,255,0.8)",
                          border: `1px solid ${linkCopied ? "rgba(22,163,74,0.4)" : "rgba(255,255,255,0.2)"}`,
                          backdropFilter: "blur(6px)",
                          fontFamily: "var(--font-inter)",
                          transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                        }}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {linkCopied ? (
                            <motion.span
                              key="check"
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.6, opacity: 0 }}
                              transition={{ duration: 0.14 }}
                              className="flex items-center gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5" /> Link Tersalin
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.6, opacity: 0 }}
                              transition={{ duration: 0.14 }}
                              className="flex items-center gap-1.5"
                            >
                              <Link2 className="h-3.5 w-3.5" /> Salin Link
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* ── Draft Warning ── */}
                {!invitation.is_published && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-2xl px-5 py-4"
                    style={{ background: "#fef3c7", border: "1px solid #fcd34d" }}
                  >
                    <span className="mt-0.5 text-base">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#92400e", fontFamily: "var(--font-inter)" }}>
                        Undangan masih Draft
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "#a16207", fontFamily: "var(--font-inter)" }}>
                        Tamu belum bisa membuka link undangan. Klik{" "}
                        <strong>Edit Undangan</strong> lalu aktifkan toggle{" "}
                        <strong>Dipublikasikan</strong>.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Quick Stats ── */}
                <motion.div
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                >
                  {[
                    { label: "Total Tamu",       value: totalGuests,  sub: "tamu diundang",        valueColor: "var(--primary)", subColor: "var(--muted-foreground)", bg: "var(--background)", border: "var(--border)" },
                    { label: "Hadir",             value: attending,    sub: totalGuests > 0 ? `${Math.round((attending / totalGuests) * 100)}% dari total` : "0%",    valueColor: "#16a34a", subColor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                    { label: "Tidak Hadir",       value: notAttending, sub: totalGuests > 0 ? `${Math.round((notAttending / totalGuests) * 100)}% dari total` : "0%", valueColor: "#dc2626", subColor: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                    { label: "Belum Konfirmasi",  value: pending,      sub: totalGuests > 0 ? `${Math.round((pending / totalGuests) * 100)}% dari total` : "0%",      valueColor: "#d97706", subColor: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                  ].map((s) => (
                    <motion.div
                      key={s.label}
                      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.09)" }}
                      transition={{ y: { type: "spring", stiffness: 400, damping: 25 }, boxShadow: { duration: 0.2 } }}
                      className="rounded-2xl p-5"
                      style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                    >
                      <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        {s.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold leading-none tabular-nums sm:text-4xl"
                        style={{ fontFamily: "var(--font-playfair)", color: s.valueColor }}>
                        {s.value}
                      </p>
                      <p className="mt-1.5 text-xs" style={{ color: s.subColor, fontFamily: "var(--font-inter)", opacity: 0.8 }}>
                        {s.sub}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* ── Response Rate ── */}
                {totalGuests > 0 && (
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Response Rate</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                          {attending + notAttending} dari {totalGuests} tamu sudah konfirmasi
                        </p>
                      </div>
                      <span className="text-3xl font-bold tabular-nums" style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}>
                        {Math.round(((attending + notAttending) / totalGuests) * 100)}%
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((attending + notAttending) / totalGuests) * 100}%` }}
                        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: "linear-gradient(to right, #16a34a, var(--primary))" }}
                      />
                    </div>
                    <div className="mt-3 flex gap-4">
                      {[
                        { label: "Hadir",       value: attending,    color: "#16a34a" },
                        { label: "Tidak Hadir", value: notAttending, color: "#dc2626" },
                        { label: "Belum",       value: pending,      color: "#d97706" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                          <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                            {s.label}: <strong style={{ color: s.color }}>{s.value}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Guests entry point ── */}
                <MotionLink
                  href="/dashboard/guests"
                  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(176,141,87,0.14)" }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex items-center justify-between rounded-2xl px-5 py-4"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "var(--muted)" }}
                    >
                      <Users className="h-5 w-5" style={{ color: "var(--primary)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Daftar Tamu</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        {totalGuests === 0
                          ? "Belum ada tamu — tambah sekarang"
                          : `${totalGuests} diundang · ${attending} hadir · ${pending} belum konfirmasi`}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                </MotionLink>

              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const event = new Date(dateStr);
  const today = new Date();
  event.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((event.getTime() - today.getTime()) / 86_400_000);
}

function getShareLink(slug: string): string {
  if (typeof window === "undefined") return "";
  const base = window.location.pathname.includes("/invitation-wedding")
    ? `${window.location.origin}/invitation-wedding`
    : window.location.origin;
  return `${base}/invite/?s=${slug}`;
}
