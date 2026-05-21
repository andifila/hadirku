"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Menu, Plus, Search, X, Upload, Download,
  Trash2, UserPlus, Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { getUserInvitations } from "@/lib/supabase/invitations";
import { getInvitationById, type Invitation } from "@/lib/supabase/invitation-crud";
import {
  getInvitationGuests, addGuest, removeGuest, bulkAddGuests,
  buildInviteUrl, toWaPhone, type Guest,
} from "@/lib/supabase/guests";
import { Sidebar } from "@/components/dashboard/Sidebar";

// ── Types & constants ─────────────────────────────────────────────────────────

type RsvpFilter = "all" | "attending" | "not_attending" | "pending";

const RSVP_CONFIG = {
  attending:     { label: "Hadir",            color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  not_attending: { label: "Tidak Hadir",      color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  pending:       { label: "Belum Konfirmasi", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
} as const;

const FILTER_TABS: { key: RsvpFilter; label: string }[] = [
  { key: "all",           label: "Semua"           },
  { key: "attending",     label: "Hadir"            },
  { key: "not_attending", label: "Tidak Hadir"      },
  { key: "pending",       label: "Belum Konfirmasi" },
];

// ── Small utilities ───────────────────────────────────────────────────────────

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function buildWaMessage(guestName: string, slug: string): string {
  const url = buildInviteUrl(slug, guestName);
  return `Yth. Bapak/Ibu/Sdr/i ${guestName},\n\nDengan hormat, kami mengundang kehadiran Anda di acara pernikahan kami.\n\nSilakan buka undangan berikut:\n${url}\n\nKonfirmasi kehadiran dapat dilakukan melalui link undangan tersebut.\n\nTerima kasih 🙏`;
}

function parseExcelGuests(file: File): Promise<Array<{ name: string; phone: string }>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
        const result = rows
          .map((row) => ({
            name:  (row["Nama"]  ?? row["nama"]  ?? row["Name"]  ?? row["name"]  ?? "").toString().trim(),
            phone: (row["No. HP"] ?? row["No HP"] ?? row["HP"] ?? row["Phone"] ?? row["phone"] ?? "").toString().trim(),
          }))
          .filter((r) => r.name.length > 0);
        resolve(result);
      } catch {
        reject(new Error("Gagal membaca file Excel."));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Nama", "No. HP"],
    ["Contoh: Budi Santoso", "08123456789"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tamu");
  XLSX.writeFile(wb, "template_tamu.xlsx");
}

// ── GuestCard ─────────────────────────────────────────────────────────────────

function GuestCard({
  guest,
  slug,
  onRemove,
}: {
  guest: Guest;
  slug: string;
  onRemove: (id: string) => void;
}) {
  const cfg = RSVP_CONFIG[guest.rsvp_status];
  const waUrl = guest.phone
    ? `https://wa.me/${toWaPhone(guest.phone)}?text=${encodeURIComponent(buildWaMessage(guest.name, slug))}`
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
      style={{
        background: "var(--background)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* Avatar */}
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
      >
        {guest.name[0]?.toUpperCase() ?? "?"}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
          {guest.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
          {guest.phone && (
            <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              {guest.phone}
            </span>
          )}
          {guest.guest_count != null && guest.guest_count > 1 && (
            <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              · {guest.guest_count} orang
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-0.5">
        {waUrl && (
          <motion.a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="rounded-lg p-1.5"
            style={{ color: "#25D366" }}
            title="Kirim undangan via WhatsApp"
          >
            <WaIcon className="h-4 w-4" />
          </motion.a>
        )}
        <motion.button
          onClick={() => onRemove(guest.id)}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="rounded-lg p-1.5"
          style={{ color: "var(--muted-foreground)" }}
          title="Hapus tamu"
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── AddGuestForm ──────────────────────────────────────────────────────────────

function AddGuestForm({
  onAdd,
  adding,
}: {
  onAdd: (name: string, phone: string) => Promise<void>;
  adding: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd(name.trim(), phone.trim());
    setName("");
    setPhone("");
  }

  const inputStyle = {
    background: "var(--muted)",
    border: "1px solid var(--border)",
    fontFamily: "var(--font-inter)",
    color: "var(--foreground)",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl p-5"
      style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
    >
      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Tambah Tamu</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama tamu *"
          required
          className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="No. HP (opsional)"
          className="rounded-xl px-3 py-2.5 text-sm outline-none sm:w-44"
          style={inputStyle}
        />
        <motion.button
          type="submit"
          disabled={adding || !name.trim()}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
            color: "var(--primary-foreground)",
            fontFamily: "var(--font-inter)",
            boxShadow: "0 2px 8px rgba(176,141,87,0.22)",
          }}
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Tambah
        </motion.button>
      </div>
    </form>
  );
}

// ── GuestsPage ────────────────────────────────────────────────────────────────

export default function GuestsPage() {
  const { user, signOut } = useAuth();
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation,   setInvitation]   = useState<Invitation | null>(null);
  const [guests,       setGuests]       = useState<Guest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [adding,       setAdding]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState<RsvpFilter>("all");
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const stats = await getUserInvitations();
      if (!stats.length) { setLoading(false); return; }
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

  function showFlash(type: "success" | "error", msg: string) {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  }

  const attending    = guests.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending      = guests.filter((g) => g.rsvp_status === "pending").length;

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = g.name.toLowerCase().includes(q) || (g.phone ?? "").includes(q);
    const matchFilter = filter === "all" || g.rsvp_status === filter;
    return matchSearch && matchFilter;
  });

  async function handleAddGuest(name: string, phone: string) {
    if (!invitationId) return;
    setAdding(true);
    try {
      const guest = await addGuest({ invitation_id: invitationId, name, phone: phone || null });
      setGuests((prev) => [guest, ...prev]);
    } catch (e) {
      showFlash("error", e instanceof Error ? e.message : "Gagal menambah tamu.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveGuest(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    try {
      await removeGuest(id);
    } catch {
      load();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !invitationId) return;
    setUploading(true);
    try {
      const rows = await parseExcelGuests(file);
      if (!rows.length) {
        showFlash("error", "Tidak ada data tamu ditemukan di file Excel.");
        return;
      }
      const count = await bulkAddGuests(invitationId, rows);
      const updated = await getInvitationGuests(invitationId);
      setGuests(updated);
      showFlash("success", `${count} tamu berhasil diimpor.`);
    } catch (e) {
      showFlash("error", e instanceof Error ? e.message : "Gagal mengimpor tamu.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
              Daftar Tamu
            </h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              Kelola dan kirim undangan ke tamu Anda
            </p>
          </div>

          {invitation && (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={downloadTemplate}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium sm:flex"
                style={{
                  background: "var(--muted)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                  fontFamily: "var(--font-inter)",
                }}
                title="Unduh template Excel"
              >
                <Download className="h-3.5 w-3.5" />
                Template
              </motion.button>

              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium disabled:opacity-60 sm:flex"
                style={{
                  background: "var(--muted)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                  fontFamily: "var(--font-inter)",
                }}
                title="Impor tamu dari Excel"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Impor Excel
              </motion.button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
              </div>

            ) : !invitation ? (
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
                  <Users className="h-7 w-7" style={{ color: "var(--primary)" }} />
                </div>
                <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
                  Buat undangan terlebih dahulu
                </h2>
                <p className="mt-2 max-w-xs text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  Daftar tamu akan aktif setelah undangan dibuat.
                </p>
              </motion.div>

            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">

                {/* Flash notification */}
                <AnimatePresence>
                  {flash && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{
                        background: flash.type === "success" ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${flash.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                      }}
                    >
                      <p
                        className="text-sm"
                        style={{
                          color: flash.type === "success" ? "#16a34a" : "#dc2626",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {flash.msg}
                      </p>
                      <button
                        onClick={() => setFlash(null)}
                        className="ml-3 rounded p-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Total Tamu",   value: guests.length, color: "var(--primary)", bg: "var(--background)", border: "var(--border)" },
                    { label: "Hadir",        value: attending,     color: "#16a34a",         bg: "#f0fdf4",          border: "#bbf7d0"       },
                    { label: "Tidak Hadir",  value: notAttending,  color: "#dc2626",         bg: "#fef2f2",          border: "#fecaca"       },
                    { label: "Belum",        value: pending,       color: "#d97706",         bg: "#fffbeb",          border: "#fde68a"       },
                  ].map((s) => (
                    <motion.div
                      key={s.label}
                      whileHover={{ y: -2, boxShadow: "0 6px 18px rgba(0,0,0,0.09)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="rounded-2xl p-4"
                      style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                    >
                      <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        {s.label}
                      </p>
                      <p
                        className="mt-1 text-3xl font-bold leading-none tabular-nums"
                        style={{ fontFamily: "var(--font-playfair)", color: s.color }}
                      >
                        {s.value}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Add guest form */}
                <AddGuestForm onAdd={handleAddGuest} adding={adding} />

                {/* Mobile Excel buttons */}
                <div className="flex gap-2 sm:hidden">
                  <motion.button
                    onClick={downloadTemplate}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      color: "var(--muted-foreground)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Template Excel
                  </motion.button>
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium disabled:opacity-60"
                    style={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      color: "var(--muted-foreground)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Impor Excel
                  </motion.button>
                </div>

                {/* Search + filter tabs */}
                <div className="flex flex-col gap-3">
                  <div
                    className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
                    style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                  >
                    <Search className="h-4 w-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari nama atau nomor tamu..."
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                    />
                    <AnimatePresence>
                      {search && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => setSearch("")}
                          className="rounded p-0.5"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Filter pill tabs */}
                  <div
                    className="flex gap-1 overflow-x-auto rounded-2xl p-1"
                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                  >
                    {FILTER_TABS.map((tab) => {
                      const count =
                        tab.key === "all"
                          ? guests.length
                          : guests.filter((g) => g.rsvp_status === tab.key).length;
                      const active = filter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setFilter(tab.key)}
                          className="relative flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
                          style={{
                            color: active ? "var(--primary)" : "var(--muted-foreground)",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {active && (
                            <motion.span
                              layoutId="filter-pill"
                              className="absolute inset-0 rounded-xl"
                              style={{ background: "var(--muted)", zIndex: -1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          {tab.label}
                          <span
                            className="rounded-full px-1.5 py-0.5 text-xs tabular-nums"
                            style={{
                              background: active ? "rgba(176,141,87,0.15)" : "var(--muted)",
                              color: active ? "var(--primary)" : "var(--muted-foreground)",
                              fontWeight: 600,
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Guest list */}
                {filtered.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                  >
                    <UserPlus
                      className="mb-3 h-8 w-8"
                      style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
                    />
                    <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                      {search || filter !== "all" ? "Tidak ada tamu yang cocok" : "Belum ada tamu"}
                    </p>
                    {!search && filter === "all" && (
                      <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        Tambah tamu di atas atau impor dari Excel
                      </p>
                    )}
                  </div>
                ) : (
                  <motion.div layout className="flex flex-col gap-2">
                    <p className="px-1 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      {filtered.length} tamu
                      {filtered.length !== guests.length ? ` (dari ${guests.length})` : ""}
                    </p>
                    <AnimatePresence mode="popLayout">
                      {filtered.map((guest) => (
                        <GuestCard
                          key={guest.id}
                          guest={guest}
                          slug={invitation.slug}
                          onRemove={handleRemoveGuest}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
