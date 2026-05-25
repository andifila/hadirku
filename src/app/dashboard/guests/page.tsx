"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Plus, Search, X, Upload, Download,
  Trash2, UserPlus, Users, UserCheck, UserX, Clock, Pencil, Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { getUserInvitations } from "@/lib/supabase/invitations";
import { getInvitationById, type Invitation } from "@/lib/supabase/invitation-crud";
import {
  getInvitationGuests, addGuest, removeGuest, bulkAddGuests, updateGuest,
  buildInviteUrl, toWaPhone, type Guest,
} from "@/lib/supabase/guests";

// ── Types & constants ─────────────────────────────────────────────────────────

type RsvpFilter = "all" | "attending" | "not_attending" | "pending";

const PAGE_SIZE = 50;

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

const DEFAULT_BLAST_TEMPLATE =
  `Yth. Bapak/Ibu/Sdr/i {nama},\n\nDengan hormat, kami mengundang kehadiran Anda di acara pernikahan kami.\n\nSilakan buka undangan berikut:\n{link}\n\nKonfirmasi kehadiran dapat dilakukan melalui link undangan tersebut.\n\nTerima kasih 🙏`;

// ── Small utilities ───────────────────────────────────────────────────────────

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function buildWaMessage(guestName: string, slug: string, template: string): string {
  const url = buildInviteUrl(slug, guestName);
  return template
    .replace(/\{nama\}/g, guestName)
    .replace(/\{link\}/g, url);
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

function downloadGuests(guests: Guest[], slug: string) {
  const STATUS: Record<string, string> = {
    attending:     "Hadir",
    not_attending: "Tidak Hadir",
    pending:       "Belum Konfirmasi",
  };
  const rows = guests.map((g) => ({
    Nama:          g.name,
    "No. HP":      g.phone ?? "",
    Status:        STATUS[g.rsvp_status] ?? g.rsvp_status,
    "Jml. Tamu":   g.guest_count ?? (g.rsvp_status === "attending" ? 1 : ""),
    Ucapan:        g.message ?? "",
    "Tgl. Konfirmasi": new Date(g.created_at).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    }),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 40 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tamu");
  XLSX.writeFile(wb, `tamu_${slug}.xlsx`);
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

// ── GuestTable (desktop) ──────────────────────────────────────────────────────

function GuestTable({
  guests,
  slug,
  onRemove,
  onEdit,
}: {
  guests: Guest[];
  slug: string;
  onRemove: (id: string) => void;
  onEdit: (guest: Guest) => void;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
            {["Tamu", "Status", "No. HP", "Kursi", "Aksi"].map((h, i) => (
              <th
                key={h}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i === 3 ? "text-right" : "text-left"}`}
                style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => {
            const cfg = RSVP_CONFIG[guest.rsvp_status];
            const waUrl = guest.phone
              ? `https://wa.me/${toWaPhone(guest.phone)}?text=${encodeURIComponent(buildWaMessage(guest.name, slug, DEFAULT_BLAST_TEMPLATE))}`
              : null;
            return (
              <tr
                key={guest.id}
                className="border-b last:border-0 transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                    >
                      {guest.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>{guest.name}</p>
                      {guest.guest_count != null && guest.guest_count > 1 && (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                          {guest.guest_count} orang
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  {guest.phone ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  {guest.rsvp_status === "attending" ? (guest.guest_count ?? 1) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
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
                      onClick={() => onEdit(guest)}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.88 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className="rounded-lg p-1.5"
                      style={{ color: "var(--muted-foreground)" }}
                      title="Edit tamu"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </motion.button>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── GuestCard ─────────────────────────────────────────────────────────────────

function GuestCard({
  guest,
  slug,
  onRemove,
  onEdit,
}: {
  guest: Guest;
  slug: string;
  onRemove: (id: string) => void;
  onEdit: (guest: Guest) => void;
}) {
  const cfg = RSVP_CONFIG[guest.rsvp_status];
  const waUrl = guest.phone
    ? `https://wa.me/${toWaPhone(guest.phone)}?text=${encodeURIComponent(buildWaMessage(guest.name, slug, DEFAULT_BLAST_TEMPLATE))}`
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
          onClick={() => onEdit(guest)}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="rounded-lg p-1.5"
          style={{ color: "var(--muted-foreground)" }}
          title="Edit tamu"
        >
          <Pencil className="h-3.5 w-3.5" />
        </motion.button>
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
  const { user } = useAuth();
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation,   setInvitation]   = useState<Invitation | null>(null);
  const [guests,       setGuests]       = useState<Guest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [adding,       setAdding]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState<RsvpFilter>("all");
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [blastMode,     setBlastMode]     = useState(false);
  const [blastIdx,      setBlastIdx]      = useState(0);
  const [blastStep,     setBlastStep]     = useState<"setup" | "sending">("setup");
  const [blastTemplate, setBlastTemplate] = useState(DEFAULT_BLAST_TEMPLATE);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [editName,     setEditName]     = useState("");
  const [editPhone,    setEditPhone]    = useState("");
  const [saving,       setSaving]       = useState(false);
  const [page,         setPage]         = useState(1);
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

  const pendingWithPhone = guests.filter((g) => g.rsvp_status === "pending" && !!g.phone);

  const attending    = guests.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending      = guests.filter((g) => g.rsvp_status === "pending").length;

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = g.name.toLowerCase().includes(q) || (g.phone ?? "").includes(q);
    const matchFilter = filter === "all" || g.rsvp_status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage      = Math.min(page, totalPages);
  const paginatedGuests = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filter]);

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

  function handleOpenEdit(guest: Guest) {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditPhone(guest.phone ?? "");
  }

  async function handleSaveEdit() {
    if (!editingGuest || !editName.trim()) return;
    setSaving(true);
    try {
      await updateGuest(editingGuest.id, { name: editName.trim(), phone: editPhone.trim() || null });
      setGuests((prev) =>
        prev.map((g) =>
          g.id === editingGuest.id
            ? { ...g, name: editName.trim(), phone: editPhone.trim() || null }
            : g
        )
      );
      setEditingGuest(null);
      showFlash("success", "Data tamu berhasil diperbarui.");
    } catch (e) {
      showFlash("error", e instanceof Error ? e.message : "Gagal mengubah tamu.");
    } finally {
      setSaving(false);
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

  const blastGuest = pendingWithPhone[blastIdx] ?? null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col" style={{ background: "var(--muted)" }}>

      {/* ── Edit Guest Modal ── */}
      <AnimatePresence>
        {editingGuest && (
          <motion.div
            key="edit-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={() => setEditingGuest(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Edit Tamu</p>
                <button onClick={() => setEditingGuest(null)} className="rounded-lg p-1" style={{ color: "var(--muted-foreground)" }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ fontFamily: "var(--font-inter)", color: "var(--muted-foreground)" }}>
                    Nama *
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nama tamu"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ fontFamily: "var(--font-inter)", color: "var(--muted-foreground)" }}>
                    No. HP
                  </label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx (opsional)"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
                  />
                </div>
                <div className="mt-1 flex gap-2">
                  <motion.button
                    onClick={handleSaveEdit}
                    disabled={saving || !editName.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)", color: "#fff", fontFamily: "var(--font-inter)" }}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Simpan
                  </motion.button>
                  <motion.button
                    onClick={() => setEditingGuest(null)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 rounded-2xl py-3 text-sm font-medium"
                    style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "var(--font-inter)", border: "1px solid var(--border)" }}
                  >
                    Batal
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WA Blast Overlay ── */}
      <AnimatePresence>
        {blastMode && invitation && (
          <motion.div
            key="blast-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                  {blastStep === "setup" ? "Atur Pesan WA" : "Kirim Undangan WA"}
                </p>
                <button
                  onClick={() => setBlastMode(false)}
                  className="rounded-lg p-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {blastStep === "setup" ? (
                /* ── Step 1: edit template ── */
                <>
                  <p className="mb-3 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    Gunakan{" "}
                    <code className="rounded px-1 py-0.5 font-mono" style={{ background: "var(--muted)" }}>{"{nama}"}</code>{" "}
                    dan{" "}
                    <code className="rounded px-1 py-0.5 font-mono" style={{ background: "var(--muted)" }}>{"{link}"}</code>{" "}
                    sebagai placeholder.
                  </p>
                  <textarea
                    value={blastTemplate}
                    onChange={(e) => setBlastTemplate(e.target.value)}
                    rows={7}
                    className="mb-2 w-full resize-none rounded-2xl px-4 py-3 text-xs outline-none"
                    style={{
                      background: "var(--muted)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      fontFamily: "var(--font-inter)",
                      lineHeight: "1.7",
                    }}
                  />
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={() => setBlastTemplate(DEFAULT_BLAST_TEMPLATE)}
                      className="text-xs underline-offset-2 hover:underline"
                      style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                    >
                      Reset ke default
                    </button>
                  </div>
                  <motion.button
                    onClick={() => setBlastStep("sending")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-full rounded-2xl py-3 text-sm font-semibold"
                    style={{
                      background: "#25D366",
                      color: "#fff",
                      fontFamily: "var(--font-inter)",
                      boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
                    }}
                  >
                    Mulai Blast · {pendingWithPhone.length} tamu →
                  </motion.button>
                </>
              ) : blastGuest ? (
                /* ── Step 2: send one by one ── */
                <>
                  {/* Progress */}
                  <div className="mb-5">
                    <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      <span>{blastIdx + 1} dari {pendingWithPhone.length}</span>
                      <span>{Math.round((blastIdx / pendingWithPhone.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
                      <motion.div
                        animate={{ width: `${(blastIdx / pendingWithPhone.length) * 100}%` }}
                        transition={{ duration: 0.35 }}
                        className="h-full rounded-full"
                        style={{ background: "#25D366" }}
                      />
                    </div>
                  </div>

                  {/* Guest card */}
                  <div
                    className="mb-4 rounded-2xl px-4 py-4"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: "#fde68a", color: "#d97706" }}
                      >
                        {blastGuest.name[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                          {blastGuest.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                          {blastGuest.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <motion.a
                      href={`https://wa.me/${toWaPhone(blastGuest.phone!)}?text=${encodeURIComponent(buildWaMessage(blastGuest.name, invitation.slug, blastTemplate))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold"
                      style={{
                        background: "#25D366",
                        color: "#fff",
                        fontFamily: "var(--font-inter)",
                        boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
                      }}
                    >
                      <WaIcon className="h-4 w-4" />
                      Buka WhatsApp
                    </motion.a>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => {
                          if (blastIdx + 1 < pendingWithPhone.length) {
                            setBlastIdx((i) => i + 1);
                          } else {
                            setBlastMode(false);
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex-1 rounded-2xl py-3 text-sm font-medium"
                        style={{
                          background: "var(--muted)",
                          color: "var(--foreground)",
                          fontFamily: "var(--font-inter)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {blastIdx + 1 < pendingWithPhone.length ? "Lanjut →" : "Selesai ✓"}
                      </motion.button>
                      {blastIdx + 1 < pendingWithPhone.length && (
                        <motion.button
                          onClick={() => setBlastIdx((i) => i + 1)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="rounded-2xl px-4 py-3 text-sm"
                          style={{
                            background: "transparent",
                            color: "var(--muted-foreground)",
                            fontFamily: "var(--font-inter)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          Lewati
                        </motion.button>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Subheader ── */}
      <header
        className="flex flex-shrink-0 items-center gap-3 px-5 py-3.5"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
      >
          <div className="flex-1">
            <h1 className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
              Daftar Tamu
            </h1>
            <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              Kelola dan kirim undangan ke tamu Anda
            </p>
          </div>

          {invitation && pendingWithPhone.length > 0 && (
            <motion.button
              onClick={() => { setBlastIdx(0); setBlastStep("setup"); setBlastMode(true); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
              style={{
                background: "rgba(37,211,102,0.12)",
                border: "1px solid rgba(37,211,102,0.3)",
                color: "#16a34a",
                fontFamily: "var(--font-inter)",
              }}
            >
              <WaIcon className="h-3.5 w-3.5" />
              Blast ({pendingWithPhone.length})
            </motion.button>
          )}

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

              {guests.length > 0 && (
                <motion.button
                  onClick={() => downloadGuests(guests, invitation.slug)}
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
                  title="Export daftar tamu ke Excel"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </motion.button>
              )}

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

      <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">

            {loading ? (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: "var(--background)" }} />
                  ))}
                </div>
                <div className="h-20 animate-pulse rounded-2xl" style={{ background: "var(--background)" }} />
                <div className="flex flex-col gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl" style={{ background: "var(--background)" }} />
                  ))}
                </div>
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
                    { label: "Total Tamu",  value: guests.length, icon: Users,      iconBg: "rgba(176,141,87,0.12)", color: "var(--primary)", bg: "var(--background)", border: "var(--border)" },
                    { label: "Hadir",       value: attending,     icon: UserCheck,  iconBg: "#dcfce7",               color: "#16a34a",         bg: "#f0fdf4",           border: "#bbf7d0"       },
                    { label: "Tidak Hadir", value: notAttending,  icon: UserX,      iconBg: "#fee2e2",               color: "#dc2626",         bg: "#fef2f2",           border: "#fecaca"       },
                    { label: "Belum",       value: pending,       icon: Clock,      iconBg: "#fef9c3",               color: "#d97706",         bg: "#fffbeb",           border: "#fde68a"       },
                  ].map((s) => (
                    <motion.div
                      key={s.label}
                      whileHover={{ y: -2, boxShadow: "0 6px 18px rgba(0,0,0,0.09)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="rounded-2xl p-4"
                      style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                    >
                      <div
                        className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: s.iconBg }}
                      >
                        <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                      </div>
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
                <div className="flex flex-wrap gap-2 sm:hidden">
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
                    Template
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
                    Impor
                  </motion.button>
                  {guests.length > 0 && (
                    <motion.button
                      onClick={() => downloadGuests(guests, invitation.slug)}
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
                      Export
                    </motion.button>
                  )}
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
                  <div className="flex flex-col gap-2">
                    <p className="px-1 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      {filtered.length} tamu
                      {filtered.length !== guests.length ? ` (dari ${guests.length})` : ""}
                      {totalPages > 1 && ` · halaman ${safePage} dari ${totalPages}`}
                    </p>

                    {/* Desktop table */}
                    <div className="hidden sm:block">
                      <GuestTable
                        guests={paginatedGuests}
                        slug={invitation.slug}
                        onRemove={handleRemoveGuest}
                        onEdit={handleOpenEdit}
                      />
                    </div>

                    {/* Mobile cards */}
                    <motion.div layout className="flex flex-col gap-2 sm:hidden">
                      <AnimatePresence mode="popLayout">
                        {paginatedGuests.map((guest) => (
                          <GuestCard
                            key={guest.id}
                            guest={guest}
                            slug={invitation.slug}
                            onRemove={handleRemoveGuest}
                            onEdit={handleOpenEdit}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <motion.button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          whileHover={{ scale: safePage === 1 ? 1 : 1.03 }}
                          whileTap={{ scale: safePage === 1 ? 1 : 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-40"
                          style={{
                            background: "var(--background)",
                            border: "1px solid var(--border)",
                            fontFamily: "var(--font-inter)",
                            color: "var(--foreground)",
                          }}
                        >
                          ← Sebelumnya
                        </motion.button>
                        <span className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                          {safePage} / {totalPages}
                        </span>
                        <motion.button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
                          whileHover={{ scale: safePage === totalPages ? 1 : 1.03 }}
                          whileTap={{ scale: safePage === totalPages ? 1 : 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-40"
                          style={{
                            background: "var(--background)",
                            border: "1px solid var(--border)",
                            fontFamily: "var(--font-inter)",
                            color: "var(--foreground)",
                          }}
                        >
                          Berikutnya →
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            )}
          </div>
      </main>
    </div>
  );
}
