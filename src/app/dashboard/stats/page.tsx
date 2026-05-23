"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, BarChart2, Users, RefreshCw, Download, QrCode } from "lucide-react";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
import { getUserInvitations } from "@/lib/supabase/invitations";
import { getInvitationGuests, type Guest } from "@/lib/supabase/guests";
import { getInvitationById, type Invitation } from "@/lib/supabase/invitation-crud";

// ── Types ─────────────────────────────────────────────────────────────────────

type RsvpStatus = "attending" | "not_attending" | "pending";

const RSVP_CFG: Record<RsvpStatus, { label: string; color: string; bg: string; border: string }> = {
  attending:     { label: "Hadir",            color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  not_attending: { label: "Tidak Hadir",      color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  pending:       { label: "Belum Konfirmasi", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function getShareLink(slug: string): string {
  if (typeof window === "undefined") return "";
  const base = window.location.pathname.includes("/invitation-wedding")
    ? `${window.location.origin}/invitation-wedding`
    : window.location.origin;
  return `${base}/invite/?s=${slug}`;
}

function downloadMessages(messages: Guest[]) {
  const STATUS: Record<string, string> = {
    attending: "Hadir", not_attending: "Tidak Hadir", pending: "Belum Konfirmasi",
  };
  const rows = messages.map((g) => ({
    Nama:    g.name,
    Status:  STATUS[g.rsvp_status] ?? g.rsvp_status,
    Ucapan:  g.message ?? "",
    Tanggal: new Date(g.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 60 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ucapan");
  XLSX.writeFile(wb, "ucapan_tamu.xlsx");
}

// ── Donut chart (pure SVG) ─────────────────────────────────────────────────────

const R = 40;
const C = 2 * Math.PI * R;

function DonutChart({
  attending, notAttending, pending,
}: { attending: number; notAttending: number; pending: number }) {
  const total = attending + notAttending + pending;

  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" className="w-full max-w-[160px]">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="20" />
        <text x="60" y="58" textAnchor="middle" style={{ fill: "var(--muted-foreground)", fontFamily: "var(--font-inter)", fontSize: "10px" }}>
          Belum ada
        </text>
        <text x="60" y="71" textAnchor="middle" style={{ fill: "var(--muted-foreground)", fontFamily: "var(--font-inter)", fontSize: "10px" }}>
          konfirmasi
        </text>
      </svg>
    );
  }

  const segments = [
    { value: attending,    color: "#16a34a" },
    { value: notAttending, color: "#dc2626" },
    { value: pending,      color: "#d97706" },
  ];

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const arc = { color: seg.color, len: (seg.value / total) * C, offset: cumulative };
    cumulative += arc.len;
    return arc;
  });

  return (
    <svg viewBox="0 0 120 120" className="w-full max-w-[160px]">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx="60" cy="60" r={R}
          fill="none"
          stroke={arc.color}
          strokeWidth="20"
          strokeDasharray={`${arc.len} ${C - arc.len}`}
          strokeDashoffset={-arc.offset}
          transform="rotate(-90 60 60)"
        />
      ))}
      <text
        x="60" y="55"
        textAnchor="middle"
        style={{ fill: "var(--foreground)", fontFamily: "var(--font-playfair)", fontSize: "22px", fontWeight: "700" }}
      >
        {total}
      </text>
      <text
        x="60" y="69"
        textAnchor="middle"
        style={{ fill: "var(--muted-foreground)", fontFamily: "var(--font-inter)", fontSize: "9px" }}
      >
        total tamu
      </text>
    </svg>
  );
}

// ── Per-day bar chart ──────────────────────────────────────────────────────────

function BarChart({ guests }: { guests: Guest[] }) {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  const byDate: Record<string, number> = {};
  guests.forEach((g) => {
    const day = g.created_at.slice(0, 10);
    byDate[day] = (byDate[day] || 0) + 1;
  });

  const counts = days.map((d) => byDate[d] || 0);
  const max = Math.max(...counts, 1);

  return (
    <div className="flex h-32 items-end gap-1">
      {days.map((d, i) => (
        <div key={d} className="flex flex-1 flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(counts[i] / max) * 96}px` }}
            transition={{ duration: 0.5, delay: i * 0.03, ease: "easeOut" }}
            className="w-full min-h-0 rounded-t-md"
            style={{
              background: counts[i] > 0
                ? "linear-gradient(to top, #b08d57, #d4a96a)"
                : "var(--muted)",
            }}
          />
          {counts[i] > 0 && (
            <span className="text-[9px] font-medium tabular-nums" style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}>
              {counts[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function BarChartLabels() {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    return `${parseInt(day)}/${parseInt(m)}`;
  };

  return (
    <div className="flex gap-1">
      {days.map((d, i) => (
        <div key={d} className="flex-1 text-center">
          {(i === 0 || i === 6 || i === 13) && (
            <span className="text-[9px]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              {fmt(d)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── StatsPage ──────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitation,   setInvitation]   = useState<Invitation | null>(null);
  const [guests,       setGuests]       = useState<Guest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [qrDataUrl,    setQrDataUrl]    = useState<string | null>(null);
  const [showQr,       setShowQr]       = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const stats = await getUserInvitations();
      if (!stats.length) return;
      const id = stats[0].invitation_id;
      setInvitationId(id);
      const [guestList, inv] = await Promise.all([
        getInvitationGuests(id),
        getInvitationById(id),
      ]);
      setGuests(guestList);
      setInvitation(inv);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!invitation?.slug) return;
    const link = getShareLink(invitation.slug);
    QRCode.toDataURL(link, { width: 256, margin: 2, color: { dark: "#1a1a1a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [invitation?.slug]);

  const attending    = guests.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending      = guests.filter((g) => g.rsvp_status === "pending").length;
  const headcount    = guests
    .filter((g) => g.rsvp_status === "attending")
    .reduce((sum, g) => sum + (g.guest_count ?? 1), 0);
  const messages     = guests.filter((g) => g.message && g.message.trim().length > 0)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col" style={{ background: "var(--muted)" }}>

      {/* Subheader */}
      <header
        className="flex flex-shrink-0 items-center gap-3 px-5 py-3.5"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex-1">
          <h1 className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Statistik</h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
            {lastUpdated
              ? `Update: ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
              : "Data RSVP & ucapan tamu"}
          </p>
        </div>
        {qrDataUrl && (
          <motion.button
            onClick={() => setShowQr(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="rounded-lg p-2"
            style={{ color: "var(--muted-foreground)" }}
            title="QR Code undangan"
          >
            <QrCode className="h-4 w-4" />
          </motion.button>
        )}
        <motion.button
          onClick={() => load(true)}
          disabled={refreshing || loading}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="rounded-lg p-2 disabled:opacity-50"
          style={{ color: "var(--muted-foreground)" }}
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </motion.button>
      </header>

      {/* QR Modal */}
      <AnimatePresence>
        {showQr && qrDataUrl && invitation && (
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
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>QR Code Undangan</p>
              <img src={qrDataUrl} alt="QR Code" className="h-48 w-48 rounded-lg" />
              <p className="text-center text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Tamu scan QR ini untuk membuka undangan
              </p>
              <div className="flex w-full gap-2">
                <motion.a
                  href={qrDataUrl}
                  download="qr_undangan.png"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
                  style={{ background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)", color: "#fff", fontFamily: "var(--font-inter)" }}
                >
                  <Download className="h-4 w-4" />
                  Unduh
                </motion.a>
                <motion.button
                  onClick={() => setShowQr(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 rounded-2xl py-3 text-sm font-medium"
                  style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "var(--font-inter)", border: "1px solid var(--border)" }}
                >
                  Tutup
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6">

            {loading ? (
              <div className="flex flex-col gap-5">
                <div className="h-64 animate-pulse rounded-2xl" style={{ background: "var(--background)" }} />
                <div className="h-52 animate-pulse rounded-2xl" style={{ background: "var(--background)" }} />
                <div className="h-72 animate-pulse rounded-2xl" style={{ background: "var(--background)" }} />
              </div>
            ) : !invitationId ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl px-6 py-24 text-center"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <BarChart2 className="mb-4 h-10 w-10" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)" }}>Buat undangan terlebih dahulu</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">

                {/* RSVP Donut + Legend */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: "var(--primary)" }} />
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Status RSVP</p>
                    {headcount > 0 && (
                      <span
                        className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: "#dcfce7", color: "#16a34a", fontFamily: "var(--font-inter)" }}
                      >
                        {headcount} orang hadir
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                    <div className="flex-shrink-0">
                      <DonutChart attending={attending} notAttending={notAttending} pending={pending} />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 w-full">
                      {(["attending", "not_attending", "pending"] as RsvpStatus[]).map((key) => {
                        const val  = key === "attending" ? attending : key === "not_attending" ? notAttending : pending;
                        const total = attending + notAttending + pending;
                        const pct  = total > 0 ? Math.round((val / total) * 100) : 0;
                        const cfg  = RSVP_CFG[key];
                        return (
                          <div key={key}>
                            <div className="mb-1 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: cfg.color }} />
                                <span className="text-xs font-medium" style={{ fontFamily: "var(--font-inter)" }}>{cfg.label}</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums" style={{ color: cfg.color, fontFamily: "var(--font-inter)" }}>
                                {val} <span className="font-normal text-[10px]" style={{ color: "var(--muted-foreground)" }}>({pct}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ background: cfg.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RSVP per hari */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" style={{ color: "var(--primary)" }} />
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>RSVP per Hari</p>
                    <span className="ml-auto text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>14 hari terakhir</span>
                  </div>
                  {guests.length === 0 ? (
                    <p className="py-6 text-center text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      Belum ada data
                    </p>
                  ) : (
                    <>
                      <BarChart guests={guests} />
                      <BarChartLabels />
                    </>
                  )}
                </div>

                {/* Ucapan & Doa */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color: "var(--primary)" }} />
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Ucapan &amp; Doa Tamu</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: "var(--muted)", color: "var(--primary)", fontFamily: "var(--font-inter)" }}
                    >
                      {messages.length}
                    </span>
                    {messages.length > 0 && (
                      <motion.button
                        onClick={() => downloadMessages(messages)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 18 }}
                        className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium"
                        style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-inter)", border: "1px solid var(--border)" }}
                        title="Export ucapan ke Excel"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </motion.button>
                    )}
                  </div>

                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <MessageSquare className="mb-3 h-7 w-7" style={{ color: "var(--muted-foreground)", opacity: 0.35 }} />
                      <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        Belum ada ucapan dari tamu
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {messages.map((g) => {
                        const cfg = RSVP_CFG[g.rsvp_status as RsvpStatus];
                        const dateStr = new Date(g.created_at).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                        });
                        return (
                          <motion.div
                            key={g.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl p-4"
                            style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <div
                                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                              >
                                {g.name[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                                  {g.name}
                                </p>
                                <p className="text-[10px]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                                  {dateStr} · {cfg.label}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)", fontFamily: "var(--font-inter)" }}>
                              &ldquo;{g.message}&rdquo;
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </div>
      </main>
    </div>
  );
}
