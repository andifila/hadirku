"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Image, Music, Upload, X, CheckCircle2, Plus, Trash2, QrCode, Copy, Check, Heart, Calendar, Palette, Settings, ChevronRight } from "lucide-react";
import {
  getTemplates,
  generateSlug,
  type Template,
} from "@/lib/supabase/invitation-crud";
import {
  uploadCover,
  uploadGallery,
  uploadMusic,
  deleteStorageFile,
  COVER_MAX_BYTES,
  MUSIC_MAX_BYTES,
  COVER_ACCEPT,
  MUSIC_ACCEPT,
} from "@/lib/supabase/storage";
import type { BankAccount } from "@/lib/supabase/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEDDING_COLORS = [
  "#b08d57", "#4a7c59", "#c06080", "#6b35a3",
  "#2563eb", "#0f766e", "#be185d", "#92400e", "#475569",
];

const TEMPLATE_COLORS: Record<string, { primary: string; muted: string }> = {
  "garden-bloom":   { primary: "#4a7c59", muted: "#e8f4e8" },
  "rustic-gold":    { primary: "#b08d57", muted: "#f3f0eb" },
  "modern-minimal": { primary: "#1a1a1a", muted: "#f5f5f5" },
  "royal-elegance": { primary: "#6b35a3", muted: "#f5f0fa" },
  "floral-dream":   { primary: "#c06080", muted: "#fdf0f5" },
};

const RESERVED_SLUGS = ["dashboard", "login", "auth", "invite", "api", "admin", "new", "edit"];

const COMMON_BANKS = ["BCA", "BNI", "BRI", "Mandiri", "CIMB Niaga", "GoPay", "OVO", "DANA", "ShopeePay", "Lainnya"];

const TABS = [
  { key: "mempelai",   label: "Mempelai",   icon: Heart    },
  { key: "acara",      label: "Acara",       icon: Calendar },
  { key: "konten",     label: "Konten",      icon: Palette  },
  { key: "pengaturan", label: "Pengaturan",  icon: Settings },
] as const;
type TabKey = typeof TABS[number]["key"];

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormValues = {
  template_id: string;
  bride_name: string;
  bride_title: string;
  bride_father_name: string;
  bride_mother_name: string;
  bride_instagram: string;
  groom_name: string;
  groom_title: string;
  groom_father_name: string;
  groom_mother_name: string;
  groom_instagram: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  akad_date: string;
  akad_time: string;
  akad_venue_name: string;
  akad_venue_address: string;
  dresscode: string;
  custom_message: string;
  cover_image_url: string;
  music_url: string;
  gallery_url_1: string;
  gallery_url_2: string;
  gallery_url_3: string;
  gallery_url_4: string;
  gallery_url_5: string;
  gallery_url_6: string;
  bank_accounts: BankAccount[];
  gift_address: string;
  owner_whatsapp: string;
  timezone: string;
  rsvp_closes_at: string;
  primary_color: string;
  slug: string;
  is_published: boolean;
};

type Props = {
  initial?: Partial<FormValues>;
  submitting: boolean;
  error: string;
  onSubmit: (values: FormValues) => void;
  submitLabel: string;
};

// ─── InvitationForm ───────────────────────────────────────────────────────────

export default function InvitationForm({ initial, submitting, error, onSubmit, submitLabel }: Props) {
  const [templates,   setTemplates]   = useState<Template[]>([]);
  const [activeTab,   setActiveTab]   = useState<TabKey>("mempelai");
  const [slideDir,    setSlideDir]    = useState(0);
  const [localError,  setLocalError]  = useState("");
  const [showAkad,    setShowAkad]    = useState(!!initial?.akad_date);
  const [slugManual,  setSlugManual]  = useState(!!initial?.slug);

  const [values, setValues] = useState<FormValues>({
    template_id:        initial?.template_id        ?? "",
    bride_name:         initial?.bride_name          ?? "",
    bride_title:        initial?.bride_title         ?? "",
    bride_father_name:  initial?.bride_father_name   ?? "",
    bride_mother_name:  initial?.bride_mother_name   ?? "",
    bride_instagram:    initial?.bride_instagram     ?? "",
    groom_name:         initial?.groom_name          ?? "",
    groom_title:        initial?.groom_title         ?? "",
    groom_father_name:  initial?.groom_father_name   ?? "",
    groom_mother_name:  initial?.groom_mother_name   ?? "",
    groom_instagram:    initial?.groom_instagram     ?? "",
    event_date:         initial?.event_date          ?? "",
    event_time:         initial?.event_time          ?? "10:00",
    venue_name:         initial?.venue_name          ?? "",
    venue_address:      initial?.venue_address       ?? "",
    akad_date:          initial?.akad_date           ?? "",
    akad_time:          initial?.akad_time           ?? "08:00",
    akad_venue_name:    initial?.akad_venue_name     ?? "",
    akad_venue_address: initial?.akad_venue_address  ?? "",
    dresscode:          initial?.dresscode           ?? "",
    custom_message:     initial?.custom_message      ?? "",
    cover_image_url:    initial?.cover_image_url     ?? "",
    music_url:          initial?.music_url           ?? "",
    gallery_url_1:      initial?.gallery_url_1       ?? "",
    gallery_url_2:      initial?.gallery_url_2       ?? "",
    gallery_url_3:      initial?.gallery_url_3       ?? "",
    gallery_url_4:      initial?.gallery_url_4       ?? "",
    gallery_url_5:      initial?.gallery_url_5       ?? "",
    gallery_url_6:      initial?.gallery_url_6       ?? "",
    bank_accounts:      initial?.bank_accounts       ?? [],
    gift_address:       initial?.gift_address        ?? "",
    owner_whatsapp:     initial?.owner_whatsapp      ?? "",
    timezone:           initial?.timezone            ?? "WIB",
    rsvp_closes_at:     initial?.rsvp_closes_at      ?? "",
    primary_color:      initial?.primary_color       ?? "",
    slug:               initial?.slug                ?? "",
    is_published:       initial?.is_published        ?? false,
  });

  useEffect(() => {
    getTemplates().then((t) => {
      setTemplates(t);
      if (!values.template_id && t.length > 0) {
        setValues((v) => ({ ...v, template_id: t[0].id }));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(key: keyof FormValues, val: string | boolean | BankAccount[]) {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      if (!slugManual && (key === "bride_name" || key === "groom_name")) {
        const bride = key === "bride_name" ? String(val) : prev.bride_name;
        const groom = key === "groom_name" ? String(val) : prev.groom_name;
        if (bride && groom) next.slug = generateSlug(bride, groom);
      }
      return next;
    });
  }

  function switchTab(key: TabKey) {
    const prevIdx = TABS.findIndex((t) => t.key === activeTab);
    const nextIdx = TABS.findIndex((t) => t.key === key);
    setSlideDir(nextIdx >= prevIdx ? 1 : -1);
    setActiveTab(key);
  }

  function toggleAkad() {
    if (showAkad) {
      setValues((v) => ({ ...v, akad_date: "", akad_time: "08:00", akad_venue_name: "", akad_venue_address: "" }));
    }
    setShowAkad((s) => !s);
  }

  function addBank() {
    set("bank_accounts", [...values.bank_accounts, { bank: "", account_name: "", account_number: "" }]);
  }
  function removeBank(i: number) {
    set("bank_accounts", values.bank_accounts.filter((_, idx) => idx !== i));
  }
  function updateBank(i: number, key: keyof Omit<BankAccount, "qris_url">, val: string) {
    set("bank_accounts", values.bank_accounts.map((acc, idx) => idx === i ? { ...acc, [key]: val } : acc));
  }
  function updateBankQris(i: number, url: string) {
    set("bank_accounts", values.bank_accounts.map((acc, idx) => idx === i ? { ...acc, qris_url: url || undefined } : acc));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");
    if (!values.template_id || !values.bride_name || !values.groom_name) {
      setLocalError("Lengkapi nama mempelai terlebih dahulu.");
      switchTab("mempelai");
      return;
    }
    if (!values.event_date || !values.event_time || !values.venue_name || !values.venue_address) {
      setLocalError("Lengkapi informasi acara terlebih dahulu.");
      switchTab("acara");
      return;
    }
    if (slugReserved) {
      setLocalError("Slug tidak valid. Ganti dengan nama lain.");
      switchTab("pengaturan");
      return;
    }
    onSubmit(values);
  }

  if (templates.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
      </div>
    );
  }

  const activeTabIndex = TABS.findIndex((t) => t.key === activeTab);
  const nextTab        = activeTabIndex < TABS.length - 1 ? TABS[activeTabIndex + 1] : null;

  const slugReserved  = RESERVED_SLUGS.includes(values.slug);
  const isPastDate    = values.event_date
    ? new Date(values.event_date) < new Date(new Date().toDateString())
    : false;

  const tabIncomplete: Record<TabKey, boolean> = {
    mempelai:   !values.template_id || !values.bride_name || !values.groom_name,
    acara:      !values.event_date || !values.event_time || !values.venue_name || !values.venue_address,
    konten:     false,
    pengaturan: slugReserved,
  };

  const tabHasRequired: Record<TabKey, boolean> = {
    mempelai: true, acara: true, konten: false, pengaturan: true,
  };

  const displayError = localError || error;

  return (
    <motion.form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div
        className="flex gap-1 overflow-x-auto rounded-2xl p-1"
        style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
      >
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          const hasIssue = tabIncomplete[t.key];
          return (
            <motion.button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative flex flex-1 flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2.5 text-xs font-medium"
              style={{
                color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
                fontFamily: "var(--font-inter)",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-active-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <t.icon className="relative z-10 h-3.5 w-3.5 flex-shrink-0" />
              <span className="relative z-10 hidden sm:inline">{t.label}</span>
              {hasIssue && !isActive && (
                <span
                  className="relative z-10 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: "#f87171" }}
                />
              )}
              {!hasIssue && !isActive && tabHasRequired[t.key] && (
                <span
                  className="relative z-10 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: "#4ade80" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <AnimatePresence mode="wait" custom={slideDir}>
        <motion.div
          key={activeTab}
          custom={slideDir}
          variants={{
            enter:  (dir: number) => ({ opacity: 0, x: dir * 24 }),
            center: { opacity: 1, x: 0 },
            exit:   (dir: number) => ({ opacity: 0, x: -dir * 24 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex flex-col gap-5"
        >

          {/* ── Tab: Mempelai ──────────────────────────────────── */}
          {activeTab === "mempelai" && (
            <>
              <SectionCard title="Tema">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {templates.map((t) => {
                    const colors   = TEMPLATE_COLORS[t.slug] ?? { primary: "#b08d57", muted: "#f3f0eb" };
                    const selected = values.template_id === t.id;
                    return (
                      <motion.button
                        key={t.id}
                        type="button"
                        onClick={() => set("template_id", t.id)}
                        whileHover={!selected ? { scale: 1.03 } : undefined}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left"
                        style={{
                          background: selected ? colors.muted : "var(--muted)",
                          border: selected ? `2px solid ${colors.primary}` : "1px solid var(--border)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        <div className="h-5 w-5 flex-shrink-0 rounded-full" style={{ background: colors.primary }} />
                        <span className="flex-1 text-xs font-medium" style={{ color: selected ? colors.primary : "var(--foreground)" }}>
                          {t.name}
                        </span>
                        {t.is_premium && (
                          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: colors.primary, color: "#fff" }}>
                            Pro
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* ── Warna aksen kustom ── */}
                {(() => {
                  const selectedSlug = templates.find(t => t.id === values.template_id)?.slug ?? "rustic-gold";
                  const defaultColor = (TEMPLATE_COLORS[selectedSlug] ?? TEMPLATE_COLORS["rustic-gold"]).primary;
                  const activeColor  = values.primary_color || defaultColor;
                  return (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        Warna Aksen
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Default */}
                        <button
                          type="button"
                          onClick={() => set("primary_color", "")}
                          title="Default tema"
                          className="h-7 w-7 rounded-full border-2 text-[9px] font-bold"
                          style={{
                            background: defaultColor,
                            borderColor: !values.primary_color ? "#1a1a1a" : "transparent",
                            color: "#fff",
                            outline: !values.primary_color ? "2px solid rgba(255,255,255,0.6)" : "none",
                            outlineOffset: "-3px",
                          }}
                        >
                          ✓
                        </button>
                        {WEDDING_COLORS.filter(c => c !== defaultColor).map((hex) => {
                          const isActive = values.primary_color === hex;
                          return (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => set("primary_color", hex)}
                              title={hex}
                              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                              style={{
                                background: hex,
                                borderColor: isActive ? "#1a1a1a" : "transparent",
                                outline: isActive ? "2px solid rgba(255,255,255,0.6)" : "none",
                                outlineOffset: "-3px",
                              }}
                            />
                          );
                        })}
                        {/* Custom color */}
                        <div
                          className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2"
                          style={{
                            background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
                            borderColor: values.primary_color && !WEDDING_COLORS.includes(values.primary_color) ? "#1a1a1a" : "transparent",
                          }}
                          title="Warna kustom"
                        >
                          <input
                            type="color"
                            value={activeColor}
                            onChange={(e) => set("primary_color", e.target.value)}
                            className="absolute inset-0 cursor-pointer opacity-0"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </SectionCard>

              <SectionCard title="Mempelai">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nama Mempelai Wanita" required>
                    <input type="text" value={values.bride_name} onChange={(e) => set("bride_name", e.target.value)} placeholder="cth. Gabriela" />
                  </Field>
                  <Field label="Nama Mempelai Pria" required>
                    <input type="text" value={values.groom_name} onChange={(e) => set("groom_name", e.target.value)} placeholder="cth. Rosandi" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gelar Mempelai Wanita">
                    <input type="text" value={values.bride_title} onChange={(e) => set("bride_title", e.target.value)} placeholder="cth. S.E., M.M." />
                  </Field>
                  <Field label="Gelar Mempelai Pria">
                    <input type="text" value={values.groom_title} onChange={(e) => set("groom_title", e.target.value)} placeholder="cth. S.T., M.Kom." />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ayah Mempelai Wanita">
                    <input type="text" value={values.bride_father_name} onChange={(e) => set("bride_father_name", e.target.value)} placeholder="cth. Bapak Hendra" />
                  </Field>
                  <Field label="Ibu Mempelai Wanita">
                    <input type="text" value={values.bride_mother_name} onChange={(e) => set("bride_mother_name", e.target.value)} placeholder="cth. Ibu Sari" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ayah Mempelai Pria">
                    <input type="text" value={values.groom_father_name} onChange={(e) => set("groom_father_name", e.target.value)} placeholder="cth. Bapak Dodi" />
                  </Field>
                  <Field label="Ibu Mempelai Pria">
                    <input type="text" value={values.groom_mother_name} onChange={(e) => set("groom_mother_name", e.target.value)} placeholder="cth. Ibu Wati" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Instagram Mempelai Wanita">
                    <div className="flex items-center gap-1.5">
                      <span className="flex-shrink-0 select-none text-sm" style={{ color: "var(--muted-foreground)" }}>@</span>
                      <input type="text" value={values.bride_instagram.replace(/^@/, "")}
                        onChange={(e) => set("bride_instagram", e.target.value.replace(/^@/, ""))}
                        placeholder="gabrielatri (opsional)" />
                    </div>
                  </Field>
                  <Field label="Instagram Mempelai Pria">
                    <div className="flex items-center gap-1.5">
                      <span className="flex-shrink-0 select-none text-sm" style={{ color: "var(--muted-foreground)" }}>@</span>
                      <input type="text" value={values.groom_instagram.replace(/^@/, "")}
                        onChange={(e) => set("groom_instagram", e.target.value.replace(/^@/, ""))}
                        placeholder="rosandifl (opsional)" />
                    </div>
                  </Field>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Tab: Acara ─────────────────────────────────────── */}
          {activeTab === "acara" && (
            <>
              <SectionCard title="Resepsi">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <Field label="Tanggal Resepsi" required>
                      <input type="date" value={values.event_date} onChange={(e) => set("event_date", e.target.value)} />
                    </Field>
                    {isPastDate && (
                      <p className="text-xs" style={{ color: "#d97706", fontFamily: "var(--font-inter)" }}>⚠️ Tanggal ini sudah lewat.</p>
                    )}
                  </div>
                  <Field label="Waktu Resepsi" required>
                    <input type="time" value={values.event_time} onChange={(e) => set("event_time", e.target.value)} />
                  </Field>
                </div>
                <Field label="Nama Venue Resepsi" required>
                  <input type="text" value={values.venue_name} onChange={(e) => set("venue_name", e.target.value)} placeholder="cth. Grand Ballroom Hotel Mulia" />
                </Field>
                <Field label="Alamat Venue Resepsi" required>
                  <textarea value={values.venue_address} onChange={(e) => set("venue_address", e.target.value)}
                    placeholder="cth. Jl. Asia Afrika No.8, Senayan, Jakarta" rows={2} className="resize-none" />
                </Field>
              </SectionCard>

              <SectionCard title="Akad Nikah">
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    role="switch"
                    aria-checked={showAkad}
                    onClick={toggleAkad}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors"
                    style={{ background: showAkad ? "var(--primary)" : "var(--border)" }}
                  >
                    <motion.span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                      animate={{ x: showAkad ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                  <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--muted-foreground)" }}>
                    {showAkad ? "Sembunyikan section Akad Nikah" : "Tampilkan section Akad Nikah"}
                  </p>
                </div>
                <AnimatePresence>
                  {showAkad && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="flex flex-col gap-4 overflow-hidden"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Tanggal Akad">
                          <input type="date" value={values.akad_date} onChange={(e) => set("akad_date", e.target.value)} />
                        </Field>
                        <Field label="Waktu Akad">
                          <input type="time" value={values.akad_time} onChange={(e) => set("akad_time", e.target.value)} />
                        </Field>
                      </div>
                      <Field label="Nama Venue Akad">
                        <input type="text" value={values.akad_venue_name} onChange={(e) => set("akad_venue_name", e.target.value)} placeholder="cth. Masjid Al-Falah" />
                      </Field>
                      <Field label="Alamat Venue Akad">
                        <textarea value={values.akad_venue_address} onChange={(e) => set("akad_venue_address", e.target.value)}
                          placeholder="cth. Jl. Sudirman No.1, Jakarta" rows={2} className="resize-none" />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SectionCard>
            </>
          )}

          {/* ── Tab: Konten ────────────────────────────────────── */}
          {activeTab === "konten" && (
            <>
              <SectionCard title="Konten">
                <Field label="Dresscode (opsional)">
                  <input type="text" value={values.dresscode} onChange={(e) => set("dresscode", e.target.value)} placeholder="cth. Pastel / Semi-formal" />
                </Field>
                <Field label="Ayat / Kutipan (opsional)">
                  <textarea value={values.custom_message} onChange={(e) => set("custom_message", e.target.value)}
                    placeholder={'cth. "Dan di antara tanda-tanda kekuasaan-Nya..." (QS. Ar-Rum: 21)'}
                    rows={3} className="resize-none" />
                </Field>
              </SectionCard>

              <SectionCard title="Media">
                <FileUploadField
                  label="Foto Cover (opsional)"
                  icon={<Image className="h-4 w-4" />}
                  accept={COVER_ACCEPT}
                  maxBytes={COVER_MAX_BYTES}
                  currentUrl={values.cover_image_url}
                  hint="JPEG / PNG / WebP — maks. 5 MB"
                  bucket="covers"
                  upload={uploadCover}
                  onUploaded={(url) => set("cover_image_url", url)}
                  onClear={() => set("cover_image_url", "")}
                />
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    Galeri Foto (opsional, maks. 6)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["gallery_url_1", "gallery_url_2", "gallery_url_3", "gallery_url_4", "gallery_url_5", "gallery_url_6"] as const).map((key, i) => (
                      <FileUploadField
                        key={key}
                        label={`Foto ${i + 1}`}
                        icon={<Image className="h-3.5 w-3.5" />}
                        accept={COVER_ACCEPT}
                        maxBytes={COVER_MAX_BYTES}
                        currentUrl={values[key]}
                        hint=""
                        bucket="covers"
                        upload={uploadGallery}
                        onUploaded={(url) => set(key, url)}
                        onClear={() => set(key, "")}
                        compact
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>JPEG / PNG / WebP — maks. 5 MB per foto</p>
                </div>
                <FileUploadField
                  label="Musik Latar (opsional)"
                  icon={<Music className="h-4 w-4" />}
                  accept={MUSIC_ACCEPT}
                  maxBytes={MUSIC_MAX_BYTES}
                  currentUrl={values.music_url}
                  hint="MP3 — maks. 8 MB"
                  bucket="music"
                  upload={uploadMusic}
                  onUploaded={(url) => set("music_url", url)}
                  onClear={() => set("music_url", "")}
                />
              </SectionCard>
            </>
          )}

          {/* ── Tab: Pengaturan ────────────────────────────────── */}
          {activeTab === "pengaturan" && (
            <>
              <SectionCard title="Rekening & Angpao">
                <div className="flex flex-col gap-3">
                  {values.bank_accounts.map((acc, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-3 rounded-xl p-4"
                      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                          Rekening {i + 1}
                        </p>
                        <motion.button
                          type="button"
                          onClick={() => removeBank(i)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.88 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          className="rounded-lg p-1"
                          style={{ color: "#dc2626" }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Bank</label>
                          <select
                            value={acc.bank}
                            onChange={(e) => updateBank(i, "bank", e.target.value)}
                            className="rounded-lg px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(176,141,87,0.18)] transition-shadow duration-150"
                            style={{ background: "var(--background)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}
                          >
                            <option value="">Pilih bank...</option>
                            {COMMON_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Nama Pemilik</label>
                          <input
                            type="text"
                            value={acc.account_name}
                            onChange={(e) => updateBank(i, "account_name", e.target.value)}
                            placeholder="cth. Gabriela Tri"
                            className="rounded-lg px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(176,141,87,0.18)] transition-shadow duration-150"
                            style={{ background: "var(--background)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Nomor Rekening</label>
                          <input
                            type="text"
                            value={acc.account_number}
                            onChange={(e) => updateBank(i, "account_number", e.target.value)}
                            placeholder="cth. 1234567890"
                            className="rounded-lg px-3 py-2 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(176,141,87,0.18)] transition-shadow duration-150"
                            style={{ background: "var(--background)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <QrCode className="h-4 w-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                        <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>QRIS (opsional)</p>
                        <div className="h-14 w-14 flex-shrink-0">
                          <FileUploadField
                            label="QRIS"
                            icon={<QrCode className="h-3.5 w-3.5" />}
                            accept={COVER_ACCEPT}
                            maxBytes={COVER_MAX_BYTES}
                            currentUrl={acc.qris_url ?? ""}
                            hint=""
                            bucket="covers"
                            upload={uploadGallery}
                            onUploaded={(url) => updateBankQris(i, url)}
                            onClear={() => updateBankQris(i, "")}
                            compact
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {values.bank_accounts.length < 4 && (
                    <motion.button
                      type="button"
                      onClick={addBank}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm"
                      style={{ background: "var(--muted)", border: "1px dashed var(--border)", color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                    >
                      <Plus className="h-4 w-4" />
                      Tambah rekening / e-wallet
                    </motion.button>
                  )}
                  {values.bank_accounts.length === 0 && (
                    <p className="text-center text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      Opsional — tambahkan jika ingin tamu mengirim hadiah digital.
                    </p>
                  )}
                </div>
                <Field label="Alamat Pengiriman Hadiah (opsional)">
                  <textarea value={values.gift_address} onChange={(e) => set("gift_address", e.target.value)}
                    placeholder="cth. Jl. Merpati No.10, Kebayoran Baru, Jakarta Selatan 12345"
                    rows={2} className="resize-none" />
                </Field>
              </SectionCard>

              <SectionCard title="Kontak">
                <div className="flex flex-col gap-1.5">
                  <Field label="Nomor WhatsApp Owner (untuk konfirmasi tamu)">
                    <input type="tel" value={values.owner_whatsapp} onChange={(e) => set("owner_whatsapp", e.target.value)} placeholder="cth. 081234567890" />
                  </Field>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    Tamu bisa konfirmasi langsung ke nomor ini setelah mengisi RSVP.
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Pengaturan">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Zona Waktu</label>
                  <select
                    value={values.timezone}
                    onChange={(e) => set("timezone", e.target.value)}
                    className="rounded-xl px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(176,141,87,0.18)] transition-shadow duration-150"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}
                  >
                    <option value="WIB">WIB — Waktu Indonesia Barat (Jakarta, Bandung, Surabaya)</option>
                    <option value="WITA">WITA — Waktu Indonesia Tengah (Bali, Makassar, Lombok)</option>
                    <option value="WIT">WIT — Waktu Indonesia Timur (Ambon, Papua)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Field label="Batas Waktu RSVP (opsional)">
                    <input
                      type="datetime-local"
                      value={values.rsvp_closes_at}
                      onChange={(e) => set("rsvp_closes_at", e.target.value)}
                    />
                  </Field>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    Setelah tanggal ini, formulir konfirmasi kehadiran tidak bisa diisi.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Field label="Link Undangan (slug)">
                    <input
                      type="text"
                      value={values.slug}
                      onChange={(e) => { setSlugManual(true); set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }}
                      placeholder="cth. rosandi-gabriela-2025"
                    />
                  </Field>
                  {values.slug && !slugReserved && <SlugPreview slug={values.slug} />}
                  {slugReserved && (
                    <p className="text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                      Slug ini tidak bisa dipakai. Gunakan nama lain.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    role="switch"
                    aria-checked={values.is_published}
                    onClick={() => set("is_published", !values.is_published)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors"
                    style={{ background: values.is_published ? "var(--primary)" : "var(--border)" }}
                  >
                    <motion.span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                      animate={{ x: values.is_published ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                  <div>
                    <p className="text-sm font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                      {values.is_published ? "Dipublikasikan" : "Draft"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      {values.is_published ? "Tamu bisa mengakses undangan." : "Hanya Anda yang bisa melihat undangan ini."}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Sticky submit bar ─────────────────────────────────── */}
      <div
        className="sticky bottom-4 z-10 overflow-hidden rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex flex-col gap-3 px-5 py-4">
          <AnimatePresence>
            {displayError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden rounded-xl px-4 py-3 text-sm"
                style={{ background: "#fef2f2", color: "#dc2626", fontFamily: "var(--font-inter)" }}
              >
                {displayError}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            {nextTab && (
              <motion.button
                type="button"
                onClick={() => switchTab(nextTab.key)}
                whileHover={{ scale: 1.02, boxShadow: "0 4px 18px rgba(176,141,87,0.4)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
                style={{ background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)", color: "var(--primary-foreground)", fontFamily: "var(--font-inter)" }}
              >
                <nextTab.icon className="h-4 w-4" />
                {nextTab.label}
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            )}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.02 } : undefined}
              whileTap={!submitting ? { scale: 0.98 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed ${nextTab ? "px-5" : "flex-1"}`}
              style={
                nextTab
                  ? { background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }
                  : { background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)", color: "var(--primary-foreground)", fontFamily: "var(--font-inter)", boxShadow: "0 2px 8px rgba(176,141,87,0.3)" }
              }
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.form>
  );
}

// ─── SlugPreview ──────────────────────────────────────────────────────────────

function SlugPreview({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const relUrl = `/invite/?s=${slug}`;

  function handleCopy() {
    const fullUrl =
      typeof window !== "undefined"
        ? (window.location.pathname.includes("/hadirku")
            ? `${window.location.origin}/hadirku${relUrl}`
            : `${window.location.origin}${relUrl}`)
        : relUrl;
    try {
      navigator.clipboard.writeText(fullUrl).catch(() => fallbackCopy(fullUrl));
    } catch {
      fallbackCopy(fullUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function fallbackCopy(text: string) {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3.5 py-2"
      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
    >
      <p className="min-w-0 flex-1 truncate font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
        {relUrl}
      </p>
      <motion.button
        type="button"
        onClick={handleCopy}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="flex-shrink-0 rounded-lg p-1"
        style={{ color: copied ? "#16a34a" : "var(--muted-foreground)" }}
        title="Salin link"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </motion.button>
    </div>
  );
}

// ─── FileUploadField ──────────────────────────────────────────────────────────

type UploadState = "idle" | "uploading" | "done" | "error";

function FileUploadField({
  label, icon, accept, maxBytes, currentUrl, hint, bucket, upload, onUploaded, onClear, compact,
}: {
  label: string;
  icon: React.ReactNode;
  accept: string;
  maxBytes: number;
  currentUrl: string;
  hint: string;
  bucket: string;
  upload: (f: File) => Promise<string>;
  onUploaded: (url: string) => void;
  onClear: () => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg,    setErrorMsg]    = useState("");

  const hasFile = !!currentUrl;
  const isImage = accept.includes("image");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) {
      setErrorMsg(`Maks. ${Math.round(maxBytes / 1024 / 1024)} MB.`);
      setUploadState("error");
      return;
    }
    setUploadState("uploading");
    setErrorMsg("");
    try {
      if (currentUrl) {
        try { await deleteStorageFile(bucket, currentUrl); } catch { /* ignore */ }
      }
      const url = await upload(file);
      onUploaded(url);
      setUploadState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload gagal.");
      setUploadState("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleClear() {
    if (currentUrl) {
      try { await deleteStorageFile(bucket, currentUrl); } catch { /* ignore */ }
    }
    onClear();
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className="relative aspect-square cursor-pointer overflow-hidden rounded-xl transition-opacity hover:opacity-80"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
          onClick={() => !hasFile && inputRef.current?.click()}
        >
          {hasFile ? (
            <>
              <img src={currentUrl} alt="" className="h-full w-full object-cover" />
              <motion.button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
              >
                <X className="h-3 w-3" />
              </motion.button>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1">
              {uploadState === "uploading"
                ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--primary)" }} />
                : <Upload className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              }
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{label}</span>
            </div>
          )}
        </div>
        {uploadState === "error" && <p className="text-[10px]" style={{ color: "#dc2626" }}>{errorMsg}</p>}
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
        {icon}{label}
      </label>
      <div className="rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)", fontFamily: "var(--font-inter)" }}>
        {hasFile ? (
          <div className="flex items-center gap-3 px-4 py-3">
            {isImage && (
              <img src={currentUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" style={{ border: "1px solid var(--border)" }} />
            )}
            <p className="flex-1 truncate text-sm">{currentUrl.split("/").pop()?.split("?")[0] ?? "file"}</p>
            <div className="flex flex-shrink-0 items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
              <motion.button
                type="button"
                onClick={handleClear}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                style={{ color: "var(--muted-foreground)" }}
                aria-label="Hapus"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadState === "uploading"}
            whileHover={uploadState !== "uploading" ? { scale: 1.01 } : undefined}
            whileTap={uploadState !== "uploading" ? { scale: 0.99 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex w-full items-center gap-3 px-4 py-3 disabled:opacity-60"
          >
            {uploadState === "uploading"
              ? <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" style={{ color: "var(--primary)" }} />
              : <Upload className="h-4 w-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
            }
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {uploadState === "uploading" ? "Mengupload..." : "Pilih file..."}
            </span>
          </motion.button>
        )}
      </div>
      {hint && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{hint}</p>}
      {uploadState === "error" && <p className="text-xs" style={{ color: "#dc2626" }}>{errorMsg}</p>}
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: "var(--background)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}>
          {title}
        </p>
      </div>
      <div className="flex flex-col gap-4 p-5">
        {children}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
        {label}
        {required && <span style={{ color: "var(--primary)" }}>*</span>}
      </label>
      <div
        className="rounded-xl px-4 py-3 transition-shadow duration-150 [&_input]:w-full [&_input]:bg-transparent [&_input]:text-sm [&_input]:outline-none [&_textarea]:w-full [&_textarea]:bg-transparent [&_textarea]:text-sm [&_textarea]:outline-none"
        style={{
          background: "var(--muted)",
          border: focused ? "1.5px solid var(--primary)" : "1px solid var(--border)",
          boxShadow: focused ? "0 0 0 3px rgba(176,141,87,0.18)" : "none",
          fontFamily: "var(--font-inter)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {children}
      </div>
    </div>
  );
}
