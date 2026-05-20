"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Calendar, ExternalLink, Loader2, Plus, Pencil,
  Download, Trash2, MessageCircle, Link2, Check, UserPlus,
  Users, FileSpreadsheet, X, Search, Menu,
  LayoutDashboard, FileText, BarChart3, Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserInvitations } from "@/lib/supabase/invitations";
import { getInvitationById, type Invitation } from "@/lib/supabase/invitation-crud";
import {
  getInvitationGuests, addGuest, removeGuest, bulkAddGuests,
  buildInviteUrl, toWaPhone, type Guest,
} from "@/lib/supabase/guests";

// Motion-enhanced Next.js Link
const MotionLink = motion(Link);

// ─── Constants ─────────────────────────────────────────────────────────────────

const RSVP = {
  attending:     { label: "Hadir",       color: "#16a34a", bg: "#f0fdf4" },
  not_attending: { label: "Tidak Hadir", color: "#dc2626", bg: "#fef2f2" },
  pending:       { label: "Belum",       color: "#d97706", bg: "#fffbeb" },
} as const;


// ─── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  userEmail,
  onSignOut,
  onClose,
  invitationId,
}: {
  userEmail: string;
  onSignOut: () => void;
  onClose?: () => void;
  invitationId?: string | null;
}) {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard",  href: "/dashboard",                                              active: true  },
    { icon: FileText,        label: "Undangan",   href: invitationId ? `/dashboard/edit?id=${invitationId}` : "/dashboard/new", active: false },
    { icon: Users,           label: "Tamu",       href: "/dashboard",                                              active: false },
    { icon: BarChart3,       label: "Statistik",  href: "/dashboard",                                              active: false },
    { icon: Settings,        label: "Pengaturan", href: "/dashboard",                                              active: false },
  ];

  return (
    <aside
      className="flex h-full w-60 flex-col"
      style={{ background: "var(--background)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <span
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}
        >
          WeddingInvite
        </span>
        {onClose && (
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.12, rotate: 90 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="rounded-lg p-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <MotionLink
            key={item.label}
            href={item.href}
            onClick={onClose}
            animate={{ backgroundColor: item.active ? "#f3f0eb" : "rgba(0,0,0,0)" }}
            whileHover={{ x: 2, backgroundColor: "#f3f0eb" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
            style={{
              color: item.active ? "var(--primary)" : "var(--muted-foreground)",
              fontFamily: "var(--font-inter)",
            }}
          >
            <span className="flex-shrink-0">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{item.label}</span>
            {item.active && (
              <motion.span
                layoutId="nav-active-dot"
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--primary)" }}
              />
            )}
          </MotionLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3">
        <div
          className="flex items-center gap-2.5 rounded-xl p-3"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-inter)" }}
          >
            {userEmail ? userEmail[0].toUpperCase() : "U"}
          </div>
          <p
            className="min-w-0 flex-1 truncate text-xs"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
          >
            {userEmail}
          </p>
          <motion.button
            onClick={onSignOut}
            title="Keluar"
            whileHover={{ scale: 1.14, rotate: 6 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="flex-shrink-0 rounded-lg p-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation,   setInvitation]   = useState<Invitation | null>(null);
  const [guests,       setGuests]       = useState<Guest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [uploadState,  setUploadState]  = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadMsg,    setUploadMsg]    = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [rsvpFilter,   setRsvpFilter]   = useState<"all" | "attending" | "not_attending" | "pending">("all");
  const [linkCopied,   setLinkCopied]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const stats = await getUserInvitations();
      if (!stats.length) return;
      const first = stats[0];
      setInvitationId(first.invitation_id);
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

  async function handleAddGuest(name: string, phone: string) {
    const guest = await addGuest({ invitation_id: invitationId!, name, phone });
    setGuests((prev) => [guest, ...prev]);
    setShowAddForm(false);
  }

  async function handleRemoveGuest(id: string) {
    await removeGuest(id);
    setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState("uploading");
    setUploadMsg("");
    try {
      const parsed = await parseExcelGuests(file);
      if (!parsed.length) {
        setUploadState("error");
        setUploadMsg("Tidak ada data tamu. Pastikan baris pertama: Nama, No. WhatsApp");
        return;
      }
      const count = await bulkAddGuests(invitationId!, parsed);
      setGuests(await getInvitationGuests(invitationId!));
      setUploadState("done");
      setUploadMsg(`${count} tamu berhasil ditambahkan.`);
    } catch (err) {
      setUploadState("error");
      setUploadMsg(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const attending    = guests.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending      = guests.filter((g) => g.rsvp_status === "pending").length;

  const filteredGuests = guests.filter((g) => {
    const matchSearch = !searchQuery.trim() || g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = rsvpFilter === "all" || g.rsvp_status === rsvpFilter;
    return matchSearch && matchFilter;
  });

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
              Kelola undangan &amp; daftar tamu
            </p>
          </div>

          {invitation && (
            <MotionLink
              href={`/dashboard/edit?id=${invitationId}`}
              whileHover={{ scale: 1.02, boxShadow: "0 4px 18px rgba(176,141,87,0.4)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--font-inter)",
                boxShadow: "0 2px 8px rgba(176,141,87,0.22)",
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit Undangan</span>
            </MotionLink>
          )}
        </header>

        {/* Scrollable page content */}
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
                  <Plus className="h-4 w-4" />
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
                  {/* Background */}
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

                  {/* Hero content */}
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
                      <span
                        className="flex items-center gap-1.5 text-sm"
                        style={{ color: "rgba(255,255,255,0.8)" }}
                      >
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        {formatDate(invitation.event_date)}
                      </span>
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {invitation.venue_name}
                      </span>
                    </div>

                    {/* Countdown badge */}
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

                {/* ── Quick Stats ── */}
                <motion.div
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                >
                  {[
                    {
                      label: "Total Tamu",
                      value: guests.length,
                      sub: guests.length === 1 ? "tamu diundang" : "tamu diundang",
                      valueColor: "var(--primary)",
                      subColor: "var(--muted-foreground)",
                      bg: "var(--background)",
                      border: "var(--border)",
                    },
                    {
                      label: "Hadir",
                      value: attending,
                      sub: guests.length > 0 ? `${Math.round((attending / guests.length) * 100)}% dari total` : "0%",
                      valueColor: "#16a34a",
                      subColor: "#16a34a",
                      bg: "#f0fdf4",
                      border: "#bbf7d0",
                    },
                    {
                      label: "Tidak Hadir",
                      value: notAttending,
                      sub: guests.length > 0 ? `${Math.round((notAttending / guests.length) * 100)}% dari total` : "0%",
                      valueColor: "#dc2626",
                      subColor: "#dc2626",
                      bg: "#fef2f2",
                      border: "#fecaca",
                    },
                    {
                      label: "Belum Konfirmasi",
                      value: pending,
                      sub: guests.length > 0 ? `${Math.round((pending / guests.length) * 100)}% dari total` : "0%",
                      valueColor: "#d97706",
                      subColor: "#d97706",
                      bg: "#fffbeb",
                      border: "#fde68a",
                    },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                      whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.09)" }}
                      transition={{
                        y: { type: "spring", stiffness: 400, damping: 25 },
                        boxShadow: { duration: 0.2 },
                      }}
                      className="rounded-2xl p-5"
                      style={{ background: stat.bg, border: `1px solid ${stat.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                    >
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                      >
                        {stat.label}
                      </p>
                      <p
                        className="mt-2 text-3xl font-bold leading-none tabular-nums sm:text-4xl"
                        style={{ fontFamily: "var(--font-playfair)", color: stat.valueColor }}
                      >
                        {stat.value}
                      </p>
                      <p
                        className="mt-1.5 text-xs"
                        style={{ color: stat.subColor, fontFamily: "var(--font-inter)", opacity: 0.8 }}
                      >
                        {stat.sub}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Response rate bar */}
                {guests.length > 0 && (
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                          Response Rate
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                        >
                          {attending + notAttending} dari {guests.length} tamu sudah konfirmasi
                        </p>
                      </div>
                      <span
                        className="text-3xl font-bold tabular-nums"
                        style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}
                      >
                        {Math.round(((attending + notAttending) / guests.length) * 100)}%
                      </span>
                    </div>
                    <div
                      className="relative h-2 overflow-hidden rounded-full"
                      style={{ background: "var(--muted)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((attending + notAttending) / guests.length) * 100}%` }}
                        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: "linear-gradient(to right, #16a34a, var(--primary))" }}
                      />
                    </div>
                    {/* Breakdown mini bars */}
                    <div className="mt-3 flex gap-4">
                      {[
                        { label: "Hadir",       value: attending,    color: "#16a34a" },
                        { label: "Tidak Hadir", value: notAttending, color: "#dc2626" },
                        { label: "Belum",       value: pending,      color: "#d97706" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ background: s.color }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                          >
                            {s.label}: <strong style={{ color: s.color }}>{s.value}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* ── Guest Section ── */}
                <div
                  className="overflow-hidden rounded-2xl"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  {/* Section header */}
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between gap-3">
                      {/* Title + contextual subtitle */}
                      <div>
                        <h2
                          className="text-base font-semibold"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          Daftar Tamu
                        </h2>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                        >
                          {guests.length === 0
                            ? "Belum ada tamu"
                            : `${guests.length} diundang · ${attending} hadir · ${pending} belum konfirmasi`}
                        </p>
                      </div>

                      {/* Actions — primary first */}
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {/* Template download — icon only, tooltip */}
                        <motion.button
                          onClick={downloadTemplate}
                          title="Download template Excel"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{
                            background: "var(--muted)",
                            color: "var(--muted-foreground)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </motion.button>

                        {/* Excel upload — icon only, tooltip */}
                        <motion.button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadState === "uploading"}
                          title="Upload daftar tamu dari Excel"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40"
                          style={{
                            background: "var(--muted)",
                            color: "var(--muted-foreground)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {uploadState === "uploading"
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <FileSpreadsheet className="h-4 w-4" />
                          }
                        </motion.button>

                        {/* Tambah Tamu — primary CTA */}
                        <motion.button
                          onClick={() => setShowAddForm((v) => !v)}
                          whileHover={{ scale: 1.02, boxShadow: "0 4px 16px rgba(176,141,87,0.38)" }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium"
                          style={{
                            background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
                            color: "var(--primary-foreground)",
                            fontFamily: "var(--font-inter)",
                            boxShadow: "0 2px 8px rgba(176,141,87,0.2)",
                          }}
                        >
                          <motion.span
                            animate={{ rotate: showAddForm ? 45 : 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 22 }}
                            className="flex items-center"
                          >
                            <Plus className="h-4 w-4 flex-shrink-0" />
                          </motion.span>
                          <span className="hidden sm:inline">Tambah Tamu</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Upload feedback */}
                  <AnimatePresence>
                    {uploadMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
                          style={{
                            background: uploadState === "done" ? "#f0fdf4" : "#fef2f2",
                            color: uploadState === "done" ? "#16a34a" : "#dc2626",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {uploadState === "done"
                              ? <Check className="h-4 w-4 flex-shrink-0" />
                              : <X className="h-4 w-4 flex-shrink-0" />
                            }
                            <span>{uploadMsg}</span>
                          </div>
                          <motion.button
                            onClick={() => setUploadMsg("")}
                            whileHover={{ scale: 1.12, rotate: 90 }}
                            whileTap={{ scale: 0.88 }}
                            transition={{ type: "spring", stiffness: 400, damping: 18 }}
                            className="flex-shrink-0 rounded-lg p-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Search + Filter toolbar */}
                  <div className="space-y-3 px-5 py-4">
                    {/* Search input */}
                    <div
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-shadow duration-200 focus-within:shadow-[0_0_0_3px_rgba(176,141,87,0.18)]"
                      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                    >
                      <Search
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: "var(--muted-foreground)" }}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama tamu..."
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ fontFamily: "var(--font-inter)" }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="flex-shrink-0 rounded-md p-0.5 hover:opacity-70"
                        >
                          <X className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                        </button>
                      )}
                    </div>

                    {/* RSVP filter tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                      {(
                        [
                          { key: "all"           as const, label: "Semua",       count: guests.length, dot: null         },
                          { key: "attending"     as const, label: "Hadir",       count: attending,     dot: "#16a34a"    },
                          { key: "not_attending" as const, label: "Tidak Hadir", count: notAttending,  dot: "#dc2626"    },
                          { key: "pending"       as const, label: "Belum",       count: pending,       dot: "#d97706"    },
                        ]
                      ).map((tab) => {
                        const active = rsvpFilter === tab.key;
                        return (
                          <motion.button
                            key={tab.key}
                            onClick={() => setRsvpFilter(tab.key)}
                            whileHover={!active ? { scale: 1.04 } : undefined}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium"
                            style={{
                              background: active ? "var(--primary)" : "var(--muted)",
                              color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
                              border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                              fontFamily: "var(--font-inter)",
                              transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
                            }}
                          >
                            {tab.dot && !active && (
                              <span
                                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                style={{ background: tab.dot }}
                              />
                            )}
                            {tab.label}
                            <span
                              className="rounded-full px-1.5 py-0.5 text-xs leading-none font-semibold"
                              style={{
                                background: active ? "rgba(255,255,255,0.25)" : "var(--border)",
                                color: active ? "#fff" : "var(--muted-foreground)",
                              }}
                            >
                              {tab.count}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add guest inline form */}
                  <AnimatePresence>
                    {showAddForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4">
                          <AddGuestForm
                            onAdd={handleAddGuest}
                            onCancel={() => setShowAddForm(false)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Guest list — pb-7 gives hover-shadow room before overflow-hidden clip */}
                  <div className="px-4 pb-7 pt-2">
                    {guests.length === 0 ? (
                      /* Empty state */
                      <div className="flex flex-col items-center justify-center rounded-2xl py-14 text-center"
                        style={{ background: "var(--muted)" }}
                      >
                        <div
                          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                          style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                        >
                          <Users className="h-6 w-6" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
                        </div>
                        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                          Belum ada tamu
                        </p>
                        <p className="mt-1 max-w-[220px] text-xs leading-relaxed"
                          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                        >
                          Tambah satu per satu atau upload sekaligus via file Excel.
                        </p>
                        <div className="mt-5 flex gap-2">
                          <motion.button
                            onClick={() => setShowAddForm(true)}
                            whileHover={{ scale: 1.03, boxShadow: "0 4px 14px rgba(176,141,87,0.32)" }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium"
                            style={{
                              background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
                              color: "var(--primary-foreground)",
                              fontFamily: "var(--font-inter)",
                              boxShadow: "0 2px 8px rgba(176,141,87,0.18)",
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                            Tambah Tamu
                          </motion.button>
                          <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium"
                            style={{
                              background: "var(--background)",
                              color: "var(--foreground)",
                              border: "1px solid var(--border)",
                              fontFamily: "var(--font-inter)",
                            }}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            Upload Excel
                          </motion.button>
                        </div>
                      </div>
                    ) : filteredGuests.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                          Tidak ada hasil
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                          Coba ubah filter atau kata pencarian.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {filteredGuests.map((guest, i) => (
                          <GuestCard
                            key={guest.id}
                            guest={guest}
                            invitation={invitation}
                            index={i}
                            onRemove={() => handleRemoveGuest(guest.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* ── Mobile FAB ── */}
      <AnimatePresence>
        {invitation && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, boxShadow: "0 8px 30px rgba(176,141,87,0.55)" }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            onClick={() => setShowAddForm((v) => !v)}
            className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full lg:hidden"
            style={{
              background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(176,141,87,0.42)",
            }}
          >
            <motion.span
              animate={{ rotate: showAddForm ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="flex items-center"
            >
              <Plus className="h-6 w-6" />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleExcelUpload}
        className="hidden"
      />
    </div>
  );
}

// ─── Add Guest Form ───────────────────────────────────────────────────────────

function AddGuestForm({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, phone: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await onAdd(name, phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah tamu.");
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl"
      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
    >
      {/* Form header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
            Tambah Tamu Baru
          </p>
        </div>
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="rounded-lg p-1.5"
          style={{ color: "var(--muted-foreground)" }}
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3 p-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap tamu *"
          required
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-inter)",
          }}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="No. WhatsApp (opsional, contoh: 08123...)"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{
            background: "var(--background)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-inter)",
          }}
        />
        {error && (
          <p className="text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
            {error}
          </p>
        )}
        <motion.button
          type="submit"
          disabled={submitting || !name.trim()}
          whileHover={!submitting && name.trim() ? { scale: 1.01, boxShadow: "0 4px 16px rgba(176,141,87,0.32)" } : {}}
          whileTap={!submitting && name.trim() ? { scale: 0.98 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
            color: "var(--primary-foreground)",
            fontFamily: "var(--font-inter)",
            boxShadow: "0 2px 8px rgba(176,141,87,0.18)",
          }}
        >
          {submitting
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><UserPlus className="h-4 w-4" /> Simpan Tamu</>
          }
        </motion.button>
      </div>
    </motion.form>
  );
}

// ─── Guest Card ───────────────────────────────────────────────────────────────

function GuestCard({
  guest,
  invitation,
  index,
  onRemove,
}: {
  guest: Guest;
  invitation: Invitation;
  index: number;
  onRemove: () => void;
}) {
  const [copied,        setCopied]        = useState(false);
  const [removing,      setRemoving]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rsvp      = RSVP[guest.rsvp_status] ?? RSVP.pending;
  const inviteUrl = buildInviteUrl(invitation.slug, guest.name);
  const waMessage = buildWaMessage(guest.name, invitation, inviteUrl);
  const waPhone   = guest.phone ? toWaPhone(guest.phone) : null;
  const waUrl     = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
  const initial   = guest.name.trim()[0]?.toUpperCase() ?? "?";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = inviteUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRemove() {
    setRemoving(true);
    setConfirmDelete(false);
    await onRemove();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(176,141,87,0.13), 0 2px 8px rgba(0,0,0,0.07)" }}
      transition={{ delay: Math.min(index * 0.035, 0.28), ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`overflow-hidden rounded-2xl${removing ? " pointer-events-none opacity-40" : ""}`}
      style={{
        background: "var(--background)",
        borderTop: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        borderLeft: `3px solid ${rsvp.color}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── Top: avatar + info + RSVP badge + delete ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Avatar — ring color signals RSVP status */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{
            background: rsvp.bg,
            color: rsvp.color,
            border: `1.5px solid ${rsvp.color}55`,
            fontFamily: "var(--font-inter)",
          }}
        >
          {initial}
        </div>

        {/* Name + phone */}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold leading-snug"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {guest.name}
          </p>
          <p
            className="mt-0.5 text-xs"
            style={{
              color: guest.phone ? "var(--muted-foreground)" : "var(--border)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {guest.phone || "No. WhatsApp belum diisi"}
          </p>
        </div>

        {/* RSVP status badge */}
        <span
          className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{
            background: rsvp.bg,
            color: rsvp.color,
            border: `1px solid ${rsvp.color}33`,
            fontFamily: "var(--font-inter)",
          }}
        >
          {rsvp.label}
        </span>

        {/* Delete — de-emphasised; only asserts presence when hovered */}
        {!confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={removing}
            title="Hapus tamu"
            className="flex-shrink-0 rounded-lg p-1.5 transition-colors hover:text-red-400 disabled:opacity-30"
            style={{ color: "var(--border)" }}
          >
            {removing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />
            }
          </button>
        )}
      </div>

      {/* ── Guest message bubble (conditional) ── */}
      {guest.message && (
        <div className="px-4 pb-3">
          <p
            className="line-clamp-2 rounded-xl px-3.5 py-2.5 text-xs italic leading-relaxed"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-inter)",
              borderLeft: "2px solid var(--border)",
            }}
          >
            &ldquo;{guest.message}&rdquo;
          </p>
        </div>
      )}

      {/* ── Action row OR confirm delete — animated swap ── */}
      <AnimatePresence mode="wait" initial={false}>
        {confirmDelete ? (
          /* Confirm banner replaces the action row — no layout collision with badge */
          <motion.div
            key="confirm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderTop: "1px solid #fecaca", background: "#fff8f8" }}
            >
              <p className="text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                Hapus <strong>{guest.name}</strong>?
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleRemove}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-85"
                  style={{ background: "#dc2626", color: "#fff", fontFamily: "var(--font-inter)" }}
                >
                  Hapus
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-2 px-4 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {/* WhatsApp — dominant CTA with gradient + glow */}
            <motion.a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #25d366 0%, #1fb855 100%)",
                color: "#fff",
                fontFamily: "var(--font-inter)",
                boxShadow: "0 2px 10px rgba(37,211,102,0.28)",
              }}
            >
              <WaIcon />
              <span>Kirim Undangan</span>
            </motion.a>

            {/* Copy link — secondary, animated icon swap */}
            <motion.button
              onClick={handleCopy}
              title="Salin link undangan tamu ini"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium"
              style={{
                background: copied ? "#f0fdf4" : "var(--muted)",
                color: copied ? "#16a34a" : "var(--muted-foreground)",
                border: `1px solid ${copied ? "#bbf7d0" : "var(--border)"}`,
                fontFamily: "var(--font-inter)",
                transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Tersalin</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5"
                  >
                    <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Salin</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── WhatsApp icon (inline SVG — lucide removed social icons) ─────────────────

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}



// ─── Utilities ────────────────────────────────────────────────────────────────

function buildWaMessage(guestName: string, inv: Invitation, inviteUrl: string): string {
  const dateStr = new Date(inv.event_date).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = inv.event_time.slice(0, 5).replace(":", ".") + " WIB";
  return (
    `Assalamualaikum / Halo ${guestName} 👋\n\n` +
    `Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di hari istimewa kami:\n\n` +
    `💍 ${inv.bride_name} & ${inv.groom_name}\n` +
    `📅 ${dateStr}\n` +
    `🕑 ${timeStr}\n` +
    `📍 ${inv.venue_name}\n\n` +
    `Lihat undangan lengkap & konfirmasi kehadiran Anda:\n` +
    `${inviteUrl}\n\n` +
    `Kami sangat menantikan kehadiran Anda 🙏`
  );
}

async function parseExcelGuests(
  file: File
): Promise<Array<{ name: string; phone: string }>> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  return rows
    .slice(1)
    .filter((row) => row[0] && String(row[0]).trim())
    .map((row) => ({
      name: String(row[0]).trim(),
      phone: row[1] ? String(row[1]).trim() : "",
    }));
}

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

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Nama", "No. WhatsApp"],
    ["Budi Santoso", "08123456789"],
    ["Siti Rahayu", ""],
  ]);
  ws["!cols"] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, "Tamu");
  XLSX.writeFile(wb, "template-daftar-tamu.xlsx");
}
