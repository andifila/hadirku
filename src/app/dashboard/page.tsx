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

// ─── Constants ─────────────────────────────────────────────────────────────────

const RSVP = {
  attending:     { label: "Hadir",       color: "#16a34a", bg: "#f0fdf4" },
  not_attending: { label: "Tidak Hadir", color: "#dc2626", bg: "#fef2f2" },
  pending:       { label: "Belum",       color: "#d97706", bg: "#fffbeb" },
} as const;

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/dashboard", active: true  },
  { icon: FileText,        label: "Undangan",   href: "/dashboard", active: false },
  { icon: Users,           label: "Tamu",       href: "/dashboard", active: false },
  { icon: BarChart3,       label: "Statistik",  href: "/dashboard", active: false },
  { icon: Settings,        label: "Pengaturan", href: "/dashboard", active: false },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  userEmail,
  onSignOut,
  onClose,
}: {
  userEmail: string;
  onSignOut: () => void;
  onClose?: () => void;
}) {
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
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => (
          <Link key={item.label} href={item.href} onClick={onClose} className="block">
            <motion.div
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
              style={{
                background: item.active ? "var(--muted)" : "transparent",
                color: item.active ? "var(--primary)" : "var(--muted-foreground)",
                fontFamily: "var(--font-inter)",
              }}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.active && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
              )}
            </motion.div>
          </Link>
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
          <button
            onClick={onSignOut}
            title="Keluar"
            className="flex-shrink-0 rounded-lg p-1.5 transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <LogOut className="h-4 w-4" />
          </button>
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--muted)" }}>

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar userEmail={user?.email ?? ""} onSignOut={signOut} />
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
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 transition-opacity hover:opacity-70 lg:hidden"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
              Dashboard
            </h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              Kelola undangan &amp; daftar tamu
            </p>
          </div>

          {invitation && (
            <Link
              href={`/dashboard/edit?id=${invitationId}`}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--font-inter)",
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit Undangan</span>
            </Link>
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
                <Link
                  href="/dashboard/new"
                  className="mt-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Buat Undangan
                </Link>
              </motion.div>

            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5"
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
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.65) 100%)" }}
                      />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(135deg, #b08d57 0%, #7a5c34 100%)" }}
                    />
                  )}

                  {/* Hero content */}
                  <div className="relative px-6 pb-5 pt-6">
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
                      className="mt-3 text-3xl font-bold leading-tight text-white"
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

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/invite/?s=${invitation.slug}${!invitation.is_published ? "&preview=1" : ""}`}
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80"
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
                      </Link>
                    </div>
                  </div>

                  {/* RSVP stats bar */}
                  <div
                    className="relative grid grid-cols-3"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.3)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {[
                      { label: "Hadir",       value: attending,    color: "#86efac" },
                      { label: "Tidak Hadir", value: notAttending, color: "#fca5a5" },
                      { label: "Belum",       value: pending,      color: "#fde68a" },
                    ].map((s, i) => (
                      <div
                        key={s.label}
                        className="flex flex-col items-center gap-0.5 py-4"
                        style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : undefined }}
                      >
                        <span
                          className="text-2xl font-bold"
                          style={{ fontFamily: "var(--font-playfair)", color: s.color }}
                        >
                          {s.value}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-inter)" }}
                        >
                          {s.label}
                        </span>
                      </div>
                    ))}
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

                {/* ── Guest Section ── */}
                <div
                  className="overflow-hidden rounded-2xl"
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div>
                      <h2 className="font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                        Daftar Tamu
                      </h2>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        {guests.length} tamu terdaftar
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadTemplate}
                        title="Download template Excel"
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
                        style={{
                          background: "var(--muted)",
                          color: "var(--foreground)",
                          border: "1px solid var(--border)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Template</span>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadState === "uploading"}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{
                          background: "var(--muted)",
                          color: "var(--foreground)",
                          border: "1px solid var(--border)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {uploadState === "uploading"
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <FileSpreadsheet className="h-3.5 w-3.5" />
                        }
                        <span className="hidden sm:inline">Excel</span>
                      </button>
                      <button
                        onClick={() => setShowAddForm((v) => !v)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-opacity hover:opacity-90"
                        style={{
                          background: "var(--primary)",
                          color: "var(--primary-foreground)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Tambah</span>
                      </button>
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
                          <span>{uploadMsg}</span>
                          <button
                            onClick={() => setUploadMsg("")}
                            className="flex-shrink-0 hover:opacity-70"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Search + Filter */}
                  <div className="space-y-3 px-5 py-4">
                    <div
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                    >
                      <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
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
                          className="flex-shrink-0 hover:opacity-70"
                        >
                          <X className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                        </button>
                      )}
                    </div>

                    {/* RSVP filter pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { key: "all"           as const, label: "Semua",       count: guests.length  },
                          { key: "attending"     as const, label: "Hadir",       count: attending      },
                          { key: "not_attending" as const, label: "Tidak Hadir", count: notAttending   },
                          { key: "pending"       as const, label: "Belum",       count: pending        },
                        ]
                      ).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setRsvpFilter(tab.key)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity"
                          style={{
                            background: rsvpFilter === tab.key ? "var(--primary)" : "var(--muted)",
                            color: rsvpFilter === tab.key ? "var(--primary-foreground)" : "var(--muted-foreground)",
                            border: `1px solid ${rsvpFilter === tab.key ? "var(--primary)" : "var(--border)"}`,
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add guest form */}
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

                  {/* Guest list */}
                  <div className="px-5 pb-5">
                    {guests.length === 0 ? (
                      <div
                        className="flex flex-col items-center justify-center rounded-xl py-12 text-center"
                        style={{ background: "var(--muted)" }}
                      >
                        <Users
                          className="mb-3 h-8 w-8 opacity-30"
                          style={{ color: "var(--muted-foreground)" }}
                        />
                        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                          Belum ada tamu
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                        >
                          Tambah manual atau upload file Excel.
                        </p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="mt-4 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium"
                          style={{
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                          Tambah Tamu
                        </button>
                      </div>
                    ) : filteredGuests.length === 0 ? (
                      <p
                        className="py-8 text-center text-sm"
                        style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                      >
                        Tidak ada tamu yang cocok dengan filter ini.
                      </p>
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
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowAddForm((v) => !v)}
            className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-xl lg:hidden"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            <Plus className="h-6 w-6" />
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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5"
      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
    >
      <p className="mb-4 text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
        Tambah Tamu
      </p>
      <div className="flex flex-col gap-3">
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
          placeholder="No. WhatsApp (opsional)"
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
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-medium"
            style={{
              background: "var(--background)",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Batal
          </button>
        </div>
      </div>
    </form>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.32) }}
      className={removing ? "opacity-40" : ""}
    >
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-inter)" }}
          >
            {initial}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight" style={{ fontFamily: "var(--font-inter)" }}>
              {guest.name}
            </p>
            {guest.phone && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                {guest.phone}
              </p>
            )}
          </div>

          {/* RSVP badge */}
          <span
            className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: rsvp.bg, color: rsvp.color, fontFamily: "var(--font-inter)" }}
          >
            {rsvp.label}
          </span>
        </div>

        {guest.message && (
          <p
            className="mt-2.5 line-clamp-2 rounded-lg px-3 py-2 text-xs italic"
            style={{
              background: "var(--background)",
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-inter)",
            }}
          >
            &ldquo;{guest.message}&rdquo;
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "#25d366", color: "#fff", fontFamily: "var(--font-inter)" }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: "var(--background)",
              color: copied ? "#16a34a" : "var(--foreground)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {copied
              ? <><Check className="h-3.5 w-3.5" /> Tersalin</>
              : <><Link2 className="h-3.5 w-3.5" /> Salin Link</>
            }
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                Hapus?
              </span>
              <button
                onClick={handleRemove}
                className="rounded-lg px-2 py-1 text-xs font-medium"
                style={{ background: "#dc2626", color: "#fff", fontFamily: "var(--font-inter)" }}
              >
                Ya
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-2 py-1 text-xs font-medium"
                style={{
                  background: "var(--muted)",
                  color: "var(--muted-foreground)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={removing}
              className="rounded-xl p-2 transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ color: "#dc2626" }}
              title="Hapus tamu"
            >
              {removing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />
              }
            </button>
          )}
        </div>
      </div>
    </motion.div>
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
