"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Heart, BarChart2, MessageSquare, Loader2, Plus, Minus } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { name: "Garden Bloom",   mood: "Segar & Natural",      primary: "#4a7c59", muted: "#e4ede6" },
  { name: "Rustic Gold",    mood: "Elegan & Hangat",       primary: "#b08d57", muted: "#ece8e0" },
  { name: "Modern Minimal", mood: "Bersih & Kontemporer", primary: "#1a1a1a", muted: "#f0f0f0" },
  { name: "Royal Elegance", mood: "Mewah & Dramatis",      primary: "#6b35a3", muted: "#ede8f5" },
  { name: "Floral Dream",   mood: "Romantis & Feminin",   primary: "#c06080", muted: "#f5e8ee" },
];

const TESTIMONIALS = [
  {
    name: "Ayu & Bima",
    date: "Maret 2025",
    text: "Luar biasa! Tamu kami langsung bisa RSVP dari WhatsApp tanpa ribet. Semua konfirmasi kehadiran terkumpul rapi di dashboard.",
    initials: "AB",
  },
  {
    name: "Sinta & Doni",
    date: "Januari 2025",
    text: "Undangannya cantik banget dan mudah dikustomisasi. Fitur blast WA ke semua tamu pending sangat menghemat waktu.",
    initials: "SD",
  },
  {
    name: "Putri & Arya",
    date: "April 2025",
    text: "Desain elegannya bikin undangan digital kami terasa premium. Statistik RSVP real-time membantu kami merencanakan katering dengan tepat.",
    initials: "PA",
  },
];

const FAQS = [
  {
    q: "Apakah layanan ini gratis?",
    a: "Ya, layanan Hadirku sepenuhnya gratis. Daftar dengan email dan langsung buat undangan.",
  },
  {
    q: "Berapa banyak tamu yang bisa ditambahkan?",
    a: "Tidak ada batasan jumlah tamu. Tambah satu per satu atau impor massal lewat file Excel.",
  },
  {
    q: "Bagaimana cara mengirim undangan ke tamu?",
    a: "Setiap tamu mendapat link unik yang bisa dikirim via WhatsApp. Gunakan fitur Blast WA untuk kirim ke semua tamu sekaligus.",
  },
  {
    q: "Apakah tamu perlu mendaftar untuk RSVP?",
    a: "Tidak. Tamu cukup buka link undangan, isi nama dan konfirmasi kehadiran — tanpa perlu akun.",
  },
  {
    q: "Bisakah saya mengubah undangan setelah dipublikasikan?",
    a: "Bisa. Undangan bisa diedit kapan saja. Perubahan langsung terlihat oleh tamu.",
  },
];

const FEATURES = [
  {
    icon: Heart,
    title: "Personal untuk setiap tamu",
    desc: "Nama tamu tampil langsung di undangan. Setiap tamu mendapat link unik via WhatsApp.",
  },
  {
    icon: BarChart2,
    title: "Pantau RSVP real-time",
    desc: "Lihat siapa yang hadir, tidak hadir, dan yang belum konfirmasi — dari dashboard.",
  },
  {
    icon: MessageSquare,
    title: "Ucapan & doa dari tamu",
    desc: "Tamu dapat menulis ucapan langsung di halaman undangan digital Anda.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[1]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);

  const ctaHref  = !mounted || loading ? "#" : user ? "/dashboard" : "/login";
  const ctaLabel = !mounted || loading ? null   : user ? "Buka Dashboard" : "Mulai Gratis";

  return (
    <div style={{ background: "var(--background)" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
        style={{ background: "var(--muted)" }}
      >
        {/* Decorative rings */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="h-[560px] w-[560px] rounded-full" style={{ border: "1px solid rgba(176,141,87,0.12)" }} />
          <div className="absolute h-[360px] w-[360px] rounded-full" style={{ border: "1px solid rgba(176,141,87,0.2)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex max-w-lg flex-col items-center"
        >
          <p
            className="mb-6 text-[9px] uppercase tracking-[0.45em]"
            style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}
          >
            Hadirku
          </p>

          <h1
            className="font-bold leading-tight"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--foreground)",
              fontSize: "clamp(2.4rem, 9vw, 3.5rem)",
              letterSpacing: "-0.01em",
            }}
          >
            Undangan Pernikahan<br />Digital yang Indah
          </h1>

          <p
            className="mt-5 max-w-sm text-sm leading-relaxed"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
          >
            Buat undangan elegan, bagikan via WhatsApp, pantau RSVP tamu — semua dari satu dashboard.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <motion.a
              href={ctaHref}
              whileHover={ctaLabel ? { scale: 1.03, boxShadow: "0 8px 28px rgba(176,141,87,0.4)" } : undefined}
              whileTap={ctaLabel ? { scale: 0.97 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-full px-7 text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
                color: "#fff",
                fontFamily: "var(--font-inter)",
                boxShadow: "0 4px 18px rgba(176,141,87,0.3)",
              }}
            >
              {!mounted || loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <>{ctaLabel} <ArrowRight className="h-4 w-4" /></>
              }
            </motion.a>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="h-8 w-px" style={{ background: "var(--border)" }} />
            <div className="h-1 w-1 rounded-full" style={{ background: "var(--primary)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Invitation mockup ────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 py-24" style={{ background: "var(--background)" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm pb-3"
        >
          <div className="absolute inset-x-6 bottom-0 h-[calc(100%-12px)] rounded-sm"
            style={{ background: "#f0ebe2", border: "1px solid #e0dbd2", transform: "rotate(1.8deg)", opacity: 0.5 }} />
          <div className="absolute inset-x-3 bottom-1 h-[calc(100%-12px)] rounded-sm"
            style={{ background: "#f5f1eb", border: "1px solid #e0dbd2", transform: "rotate(-1deg)", opacity: 0.7 }} />
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <div
              className="overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #fffdf9 0%, #f8f4ee 100%)",
                border: "1px solid #e0dbd2",
                boxShadow: "0 40px 100px -24px rgba(0,0,0,0.13), 0 0 0 1px rgba(255,255,255,0.8)",
              }}
            >
              <div className="px-10 py-12 text-center">
                <p
                  className="mb-10 text-[9px] uppercase tracking-[0.4em]"
                  style={{ color: "#b08d57", fontFamily: "var(--font-inter)" }}
                >
                  Undangan Pernikahan
                </p>
                <p className="mb-1 text-[9px] uppercase tracking-[0.3em]"
                  style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Kepada Yth.</p>
                <p className="mb-7 text-base font-medium italic"
                  style={{ fontFamily: "var(--font-playfair)" }}>Bapak/Ibu Tamu Undangan</p>
                <div className="mb-7 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "#e0dbd2" }} />
                  <Heart className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#b08d57" }} fill="#b08d57" />
                  <div className="h-px flex-1" style={{ background: "#e0dbd2" }} />
                </div>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Sarah</p>
                <p className="my-1.5 text-[10px]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>&amp;</p>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Raka</p>
                <p className="mt-6 text-[10px] tracking-wider"
                  style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  Sabtu, 15 Maret 2026
                </p>
              </div>
              <div
                className="py-4 text-center text-[10px] uppercase tracking-[0.25em] font-medium"
                style={{ background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)", color: "#fff", fontFamily: "var(--font-inter)" }}
              >
                Buka Undangan
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ background: "var(--muted)" }}>
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-[9px] uppercase tracking-[0.4em]"
              style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}>Fitur</p>
            <h2
              className="font-bold"
              style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.75rem, 6vw, 2.25rem)" }}
            >
              Semua yang Anda butuhkan
            </h2>
          </motion.div>

          <div className="flex flex-col gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-5 rounded-2xl p-5"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--muted)" }}
                >
                  <f.icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ fontFamily: "var(--font-playfair)", fontSize: "1.05rem" }}>
                    {f.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates ────────────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-sm">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <p className="mb-3 text-[9px] uppercase tracking-[0.4em]"
              style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}>5 Tema</p>
            <h2 className="font-bold" style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.75rem, 6vw, 2.25rem)" }}>
              Pilih yang paling Anda
            </h2>
          </motion.div>

          {/* Live mini preview — updates on tap */}
          <motion.div
            key={selectedTemplate.name}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 overflow-hidden px-10 py-10 text-center"
            style={{
              background: `linear-gradient(160deg, #fffdf9 0%, ${selectedTemplate.muted} 100%)`,
              border: `1px solid ${selectedTemplate.primary}28`,
              boxShadow: `0 24px 64px -16px ${selectedTemplate.primary}18, 0 0 0 1px rgba(255,255,255,0.8)`,
            }}
          >
            <p className="mb-6 text-[8px] uppercase tracking-[0.4em]"
              style={{ color: selectedTemplate.primary, fontFamily: "var(--font-inter)" }}>
              Undangan Pernikahan
            </p>
            <p className="mb-1 text-[8px] uppercase tracking-[0.3em]"
              style={{ color: "#aaa", fontFamily: "var(--font-inter)" }}>Kepada Yth.</p>
            <p className="mb-5 text-sm font-medium italic"
              style={{ fontFamily: "var(--font-playfair)" }}>Bapak/Ibu Tamu Undangan</p>
            <div className="mb-5 flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: `${selectedTemplate.primary}28` }} />
              <Heart className="h-3 w-3" style={{ color: selectedTemplate.primary }} fill="currentColor" />
              <div className="h-px flex-1" style={{ background: `${selectedTemplate.primary}28` }} />
            </div>
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Sarah</p>
            <p className="my-1 text-[9px]" style={{ color: "#aaa", fontFamily: "var(--font-inter)" }}>&amp;</p>
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>Raka</p>
            <p className="mt-4 text-[9px] tracking-wider"
              style={{ color: "#aaa", fontFamily: "var(--font-inter)" }}>
              Sabtu, 15 Maret 2026
            </p>
          </motion.div>

          {/* Template selector */}
          <div className="flex flex-col gap-2">
            {TEMPLATES.map((t, i) => {
              const isSelected = selectedTemplate.name === t.name;
              return (
                <motion.button
                  key={t.name}
                  onClick={() => setSelectedTemplate(t)}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left"
                  style={{
                    background: isSelected ? t.muted : "transparent",
                    border: `1px solid ${isSelected ? t.primary + "44" : "var(--border)"}`,
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                >
                  <div className="h-7 w-7 flex-shrink-0 rounded-full" style={{ background: t.primary }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium"
                      style={{ fontFamily: "var(--font-inter)", color: isSelected ? t.primary : "var(--foreground)" }}>
                      {t.name}
                    </p>
                    <p className="mt-0.5 text-[10px]"
                      style={{ fontFamily: "var(--font-inter)", color: isSelected ? t.primary : "var(--muted-foreground)", opacity: 0.7 }}>
                      {t.mood}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: t.primary }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ background: "var(--muted)" }}>
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-[9px] uppercase tracking-[0.4em]"
              style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}>Testimoni</p>
            <h2 className="font-bold" style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.75rem, 6vw, 2.25rem)" }}>
              Dipercaya pasangan bahagia
            </h2>
          </motion.div>

          <div className="flex flex-col gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.09 }}
                className="rounded-2xl p-5"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <p className="mb-4 leading-relaxed"
                  style={{ fontFamily: "var(--font-inter)", fontSize: "0.875rem", color: "var(--foreground)", fontStyle: "italic" }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)", color: "#fff", fontFamily: "var(--font-inter)" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>{t.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>{t.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="px-6 py-24" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-[9px] uppercase tracking-[0.4em]"
              style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}>FAQ</p>
            <h2 className="font-bold" style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.75rem, 6vw, 2.25rem)" }}>
              Pertanyaan umum
            </h2>
          </motion.div>

          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="overflow-hidden rounded-2xl"
                style={{ border: "1px solid var(--border)" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  style={{ background: openFaq === i ? "var(--muted)" : "var(--background)", transition: "background 0.2s" }}
                >
                  <p className="pr-4 text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                    {faq.q}
                  </p>
                  <div className="flex-shrink-0" style={{ color: "var(--primary)" }}>
                    {openFaq === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p
                        className="px-5 pb-4 text-sm leading-relaxed"
                        style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                      >
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-28 text-center" style={{ background: "var(--primary)" }}>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div style={{ width: 480, height: 480, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <p className="mb-4 text-[9px] uppercase tracking-[0.45em]"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>
            Mulai sekarang
          </p>
          <h2
            className="font-bold text-white"
            style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(1.9rem, 7vw, 2.75rem)" }}
          >
            Buat undangan pertama Anda, gratis
          </h2>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-inter)" }}>
            Tidak perlu kartu kredit. Cukup email Anda.
          </p>
          <motion.a
            href={ctaHref}
            whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="mt-9 inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-medium"
            style={{ background: "#fff", color: "var(--primary)", fontFamily: "var(--font-inter)" }}
          >
            {ctaLabel ?? "Mulai Gratis"} <ArrowRight className="h-4 w-4" />
          </motion.a>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="flex items-center justify-between px-6 py-7"
        style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}
      >
        <p className="text-[9px] uppercase tracking-[0.25em]"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)", opacity: 0.5 }}>
          Hadirku
        </p>
        <Link
          href="/login"
          className="text-xs transition-opacity hover:opacity-60"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
        >
          Masuk
        </Link>
      </footer>
    </div>
  );
}
