"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, ExternalLink, Loader2,
  Link2, Check, Users, ArrowRight, Pencil,
  UserCheck, UserX, Clock, Download, QrCode, X,
} from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { getUserInvitations, type InvitationStat } from "@/lib/supabase/invitations";
import { getInvitationById, updateInvitation, type Invitation } from "@/lib/supabase/invitation-crud";
import { getInvitationGuests, type Guest } from "@/lib/supabase/guests";

const MotionLink = motion(Link);

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { signOut } = useAuth();
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation,   setInvitation]   = useState<Invitation | null>(null);
  const [stat,         setStat]         = useState<InvitationStat | null>(null);
  const [guests,       setGuests]       = useState<Guest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [linkCopied,   setLinkCopied]   = useState(false);
  const [qrDataUrl,    setQrDataUrl]    = useState<string | null>(null);
  const [showQr,       setShowQr]       = useState(false);
  const [isLive,       setIsLive]       = useState(false);
  const load = useCallback(async () => {
    try {
      const stats = await getUserInvitations();
      if (!stats.length) return;
      const first = stats[0];
      setInvitationId(first.invitation_id);
      setStat(first);
      const [inv, guestList] = await Promise.all([
        getInvitationById(first.invitation_id),
        getInvitationGuests(first.invitation_id),
      ]);
      setInvitation(inv);
      setGuests(guestList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!invitationId) return;
    const channel = supabase
      .channel(`dashboard-guests-${invitationId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "guests",
        filter: `invitation_id=eq.${invitationId}`,
      }, () => { load(); })
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });
    return () => {
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  }, [invitationId, load]);

  const attending    = stat?.attending    ?? 0;
  const notAttending = stat?.not_attending ?? 0;
  const pending      = stat?.pending      ?? 0;
  const totalGuests  = stat?.total_guests ?? 0;
  const headcount    = guests
    .filter((g) => g.rsvp_status === "attending")
    .reduce((sum, g) => sum + (g.guest_count ?? 1), 0);

  useEffect(() => {
    if (!invitation?.slug) return;
    const link = getShareLink(invitation.slug);
    QRCode.toDataURL(link, { width: 256, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [invitation?.slug]);

  const daysUntil = invitation ? getDaysUntil(invitation.event_date) : null;

  const [publishing,   setPublishing]   = useState(false);
  const [publishError, setPublishError] = useState("");

  async function handleTogglePublish() {
    if (!invitationId || !invitation) return;
    setPublishing(true);
    setPublishError("");
    try {
      await updateInvitation(invitationId, { is_published: !invitation.is_published });
      setInvitation((prev) => prev ? { ...prev, is_published: !prev.is_published } : prev);
    } catch {
      setPublishError("Gagal mengubah status. Coba lagi.");
      setTimeout(() => setPublishError(""), 4000);
    } finally {
      setPublishing(false);
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col" style={{ background: "var(--muted)" }}>
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
              <>
              {/* ── QR Modal ── */}
              <AnimatePresence>
                {showQr && qrDataUrl && (
                  <motion.div
                    key="qr-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowQr(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 16 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 16 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl p-6"
                      style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex w-full items-center justify-between">
                        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>QR Code Undangan</p>
                        <button onClick={() => setShowQr(false)} className="rounded-lg p-1" style={{ color: "var(--muted-foreground)" }}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <img src={qrDataUrl} alt="QR Code" className="h-48 w-48 rounded-lg" />
                      <p className="text-center text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        Tamu scan QR ini untuk membuka undangan
                      </p>
                      <motion.a
                        href={qrDataUrl}
                        download="qr_undangan.png"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
                        style={{ background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)", color: "#fff", fontFamily: "var(--font-inter)" }}
                      >
                        <Download className="h-4 w-4" />
                        Unduh QR
                      </motion.a>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                            ? `${daysUntil} hari lagi`
                            : daysUntil === 0
                              ? "Hari ini"
                              : "Telah berlangsung"}
                        </span>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <MotionLink
                        href={`/dashboard/edit?id=${invitationId}`}
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
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </MotionLink>
                      {/* WA Share */}
                      <motion.a
                        href={`https://wa.me/?text=${encodeURIComponent(`Yth. Anda diundang ke pernikahan kami 🎊\n${getShareLink(invitation.slug)}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.03, backgroundColor: "rgba(37,211,102,0.35)" }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium"
                        style={{
                          background: "rgba(37,211,102,0.2)",
                          color: "#25D366",
                          border: "1px solid rgba(37,211,102,0.35)",
                          backdropFilter: "blur(6px)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        <WaIcon className="h-3.5 w-3.5" />
                        Bagikan
                      </motion.a>
                      {/* QR Code */}
                      {qrDataUrl && (
                        <motion.button
                          onClick={() => setShowQr(true)}
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
                          <QrCode className="h-3.5 w-3.5" />
                          QR Code
                        </motion.button>
                      )}
                      <motion.a
                        href={getShareLink(invitation.slug) + (!invitation.is_published ? "&preview=1" : "")}
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
                      <motion.button
                        onClick={handleTogglePublish}
                        disabled={publishing}
                        whileHover={{ scale: publishing ? 1 : 1.03 }}
                        whileTap={{ scale: publishing ? 1 : 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium"
                        style={{
                          background: invitation.is_published ? "rgba(220,38,38,0.18)" : "rgba(22,163,74,0.18)",
                          color: invitation.is_published ? "#fca5a5" : "#86efac",
                          border: `1px solid ${invitation.is_published ? "rgba(220,38,38,0.35)" : "rgba(22,163,74,0.35)"}`,
                          backdropFilter: "blur(6px)",
                          fontFamily: "var(--font-inter)",
                          opacity: publishing ? 0.6 : 1,
                        }}
                      >
                        {publishing
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : invitation.is_published ? "Unpublish" : "Publish"}
                      </motion.button>
                    </div>
                    {publishError && (
                      <p className="mt-2 text-xs" style={{ color: "#fca5a5", fontFamily: "var(--font-inter)" }}>
                        {publishError}
                      </p>
                    )}
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
                        Tamu belum bisa membuka link undangan. Klik tombol{" "}
                        <strong>Publish</strong> di atas untuk mempublikasikan undangan.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Quick Stats ── */}
                {isLive && (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#16a34a" }} />
                      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#16a34a" }} />
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "#16a34a", fontFamily: "var(--font-inter)" }}>
                      Live
                    </span>
                  </div>
                )}
                <motion.div
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                >
                  {[
                    { label: "Total Tamu",       value: totalGuests,  sub: "tamu diundang",        icon: Users,       iconBg: "rgba(176,141,87,0.12)", valueColor: "var(--primary)", subColor: "var(--muted-foreground)", bg: "var(--background)", border: "var(--border)" },
                    { label: "Hadir",             value: attending,    sub: headcount > 0 ? `${headcount} orang hadir` : (totalGuests > 0 ? `${Math.round((attending / totalGuests) * 100)}%` : "0%"),    icon: UserCheck, iconBg: "#dcfce7",               valueColor: "#16a34a", subColor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                    { label: "Tidak Hadir",       value: notAttending, sub: totalGuests > 0 ? `${Math.round((notAttending / totalGuests) * 100)}% dari total` : "0%", icon: UserX,     iconBg: "#fee2e2",               valueColor: "#dc2626", subColor: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                    { label: "Belum Konfirmasi",  value: pending,      sub: totalGuests > 0 ? `${Math.round((pending / totalGuests) * 100)}% dari total` : "0%",      icon: Clock,     iconBg: "#fef9c3",               valueColor: "#d97706", subColor: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                  ].map((s) => (
                    <motion.div
                      key={s.label}
                      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.09)" }}
                      transition={{ y: { type: "spring", stiffness: 400, damping: 25 }, boxShadow: { duration: 0.2 } }}
                      className="rounded-2xl p-4"
                      style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                    >
                      <div
                        className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{ background: s.iconBg }}
                      >
                        <s.icon className="h-4 w-4" style={{ color: s.valueColor }} />
                      </div>
                      <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        {s.label}
                      </p>
                      <p className="mt-1 text-3xl font-bold leading-none tabular-nums sm:text-4xl"
                        style={{ fontFamily: "var(--font-playfair)", color: s.valueColor }}>
                        {s.value}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: s.subColor, fontFamily: "var(--font-inter)", opacity: 0.8 }}>
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

                {/* ── Onboarding Checklist ── */}
                {!(totalGuests > 0 && invitation.is_published && attending > 0) && (
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                  >
                    <p className="mb-3 text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Checklist Persiapan</p>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "Buat undangan",              done: true },
                        { label: "Tambah tamu pertama",        done: totalGuests > 0 },
                        { label: "Publikasikan undangan",      done: invitation.is_published },
                        { label: "Kirim & konfirmasi pertama", done: attending > 0 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                            style={{
                              background: item.done ? "#16a34a" : "var(--muted)",
                              border: item.done ? "none" : "1px solid var(--border)",
                            }}
                          >
                            {item.done && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <p
                            className="text-sm"
                            style={{
                              fontFamily: "var(--font-inter)",
                              color: item.done ? "var(--muted-foreground)" : "var(--foreground)",
                              textDecoration: item.done ? "line-through" : "none",
                            }}
                          >
                            {item.label}
                          </p>
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
              </>
            )}
          </div>
        </main>
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
  const base = window.location.pathname.includes("/hadirku")
    ? `${window.location.origin}/hadirku`
    : window.location.origin;
  return `${base}/invite/?s=${slug}`;
}
