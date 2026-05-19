"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Calendar, ExternalLink, Loader2, Plus, Pencil,
  Download, Trash2, MessageCircle, Link2, Check, UserPlus,
  Users, FileSpreadsheet, X, CheckCircle2, Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserInvitations } from "@/lib/supabase/invitations";
import { getInvitationById, type Invitation } from "@/lib/supabase/invitation-crud";
import {
  getInvitationGuests, addGuest, removeGuest, bulkAddGuests,
  buildInviteUrl, toWaPhone, type Guest,
} from "@/lib/supabase/guests";

// ─── RSVP labels ──────────────────────────────────────────────────────────────

const RSVP = {
  attending:     { label: "Hadir",       color: "#16a34a", bg: "#f0fdf4" },
  not_attending: { label: "Tidak Hadir", color: "#dc2626", bg: "#fef2f2" },
  pending:       { label: "Belum",       color: "#d97706", bg: "#fffbeb" },
} as const;

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
        setUploadMsg("Tidak ada data tamu ditemukan. Pastikan baris pertama adalah header: Nama, No. WhatsApp");
        return;
      }
      const count = await bulkAddGuests(invitationId!, parsed);
      const refreshed = await getInvitationGuests(invitationId!);
      setGuests(refreshed);
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

  const filteredGuests = searchQuery.trim()
    ? guests.filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : guests;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen" style={{ background: "var(--muted)" }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-10 px-4 py-4"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}
          >
            Wedding Invite
          </span>
          <div className="flex items-center gap-3">
            <span
              className="hidden text-sm sm:block"
              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
            >
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors hover:opacity-80"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : !invitation ? (
          /* ── Empty state ── */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl px-4 py-24 text-center"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
          >
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "var(--muted)" }}
            >
              <Calendar className="h-7 w-7" style={{ color: "var(--primary)" }} />
            </div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
              Belum ada undangan
            </h2>
            <p
              className="mt-2 max-w-xs text-sm"
              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
            >
              Buat undangan pernikahan digital Anda dan bagikan ke tamu lewat WhatsApp.
            </p>
            <Link
              href="/dashboard/new"
              className="mt-6 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-inter)" }}
            >
              <Plus className="h-4 w-4" />
              Buat Undangan
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">

            {/* ── Invitation Card ── */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      background: invitation.is_published ? "#f0fdf4" : "var(--muted)",
                      color: invitation.is_published ? "#16a34a" : "var(--muted-foreground)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: invitation.is_published ? "#16a34a" : "var(--muted-foreground)" }}
                    />
                    {invitation.is_published ? "Dipublikasikan" : "Draft"}
                  </span>
                  <h1
                    className="mt-2 text-2xl font-bold leading-snug"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {invitation.bride_name} &amp; {invitation.groom_name}
                  </h1>
                  <p
                    className="mt-1 flex items-center gap-1.5 text-sm"
                    style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                  >
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    {formatDate(invitation.event_date)}
                  </p>
                  <p
                    className="mt-0.5 text-sm"
                    style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                  >
                    {invitation.venue_name}
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Link
                    href={`/invite/?s=${invitation.slug}${!invitation.is_published ? "&preview=1" : ""}`}
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      background: "var(--muted)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lihat</span>
                  </Link>
                  <Link
                    href={`/dashboard/edit?id=${invitationId}`}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-90"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-inter)" }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Guest Section ── */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              {/* Section header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <h2 className="font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Daftar Tamu</h2>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    {guests.length} tamu terdaftar
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      background: "var(--muted)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-inter)",
                    }}
                    title="Download template Excel"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Template</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadState === "uploading"}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-60"
                    style={{
                      background: "var(--muted)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-inter)",
                    }}
                    title="Upload Excel"
                  >
                    {uploadState === "uploading"
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <FileSpreadsheet className="h-3.5 w-3.5" />
                    }
                    <span className="hidden sm:inline">Upload Excel</span>
                  </button>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-90"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-inter)" }}
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
                      <button onClick={() => setUploadMsg("")} className="flex-shrink-0 hover:opacity-70">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 px-5 py-4">
                {[
                  { label: "Hadir",       value: attending,    color: "#16a34a" },
                  { label: "Tidak Hadir", value: notAttending, color: "#dc2626" },
                  { label: "Belum",       value: pending,      color: "#d97706" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center gap-0.5 rounded-xl py-3"
                    style={{ background: "var(--muted)" }}
                  >
                    <span
                      className="text-xl font-bold"
                      style={{ fontFamily: "var(--font-playfair)", color: s.color }}
                    >
                      {s.value}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Search */}
              {guests.length > 0 && (
                <div className="px-5 pb-3">
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
                      <button onClick={() => setSearchQuery("")} className="flex-shrink-0 hover:opacity-70">
                        <X className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                      </button>
                    )}
                  </div>
                </div>
              )}

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
                      <AddGuestForm onAdd={handleAddGuest} onCancel={() => setShowAddForm(false)} />
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
                    <Users className="mb-3 h-8 w-8 opacity-30" style={{ color: "var(--muted-foreground)" }} />
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
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-inter)" }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Tambah Tamu
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredGuests.length === 0 && searchQuery ? (
                      <p className="py-6 text-center text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        Tidak ada tamu dengan nama &ldquo;{searchQuery}&rdquo;
                      </p>
                    ) : filteredGuests.map((guest, i) => (
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
      </main>

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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      <p className="mb-4 text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Tambah Tamu</p>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap tamu *"
          required
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--background)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="No. WhatsApp (opsional, misal: 08123...)"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: "var(--background)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}
        />
        {error && (
          <p className="text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>{error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-inter)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-medium"
            style={{ background: "var(--background)", color: "var(--muted-foreground)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}
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
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rsvp = RSVP[guest.rsvp_status] ?? RSVP.pending;
  const inviteUrl = buildInviteUrl(invitation.slug, guest.name);
  const waMessage = buildWaMessage(guest.name, invitation, inviteUrl);
  const waPhone = guest.phone ? toWaPhone(guest.phone) : null;
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

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
      transition={{ delay: index * 0.04 }}
      className={removing ? "opacity-40" : ""}
    >
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
              {guest.name}
            </p>
            {guest.phone && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                {guest.phone}
              </p>
            )}
            {guest.message && (
              <p
                className="mt-1 line-clamp-2 text-xs italic"
                style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
              >
                &ldquo;{guest.message}&rdquo;
              </p>
            )}
          </div>
          <span
            className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: rsvp.bg, color: rsvp.color, fontFamily: "var(--font-inter)" }}
          >
            {rsvp.label}
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "#25d366", color: "#fff", fontFamily: "var(--font-inter)" }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: "var(--background)",
              color: copied ? "#16a34a" : "var(--foreground)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {copied
              ? <><Check className="h-3.5 w-3.5" />Tersalin</>
              : <><Link2 className="h-3.5 w-3.5" />Salin Link</>
            }
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>Hapus?</span>
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
                style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={removing}
              className="rounded-xl p-2 transition-all hover:opacity-70 disabled:opacity-40"
              style={{ color: "#dc2626" }}
              title="Hapus tamu"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function buildWaMessage(guestName: string, inv: Invitation, inviteUrl: string): string {
  const eventDate = new Date(inv.event_date);
  const dateStr = eventDate.toLocaleDateString("id-ID", {
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
