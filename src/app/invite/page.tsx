"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Clock, Heart, Loader2, CheckCircle,
  Phone, MessageSquare, User, Music, Music2, Mail, Shirt,
  CreditCard, Copy, Check,
} from "lucide-react";
import {
  getInvitationBySlug,
  getInvitationBySlugPreview,
  getPublicMessages,
  type PublicInvitation,
  type GuestMessage,
} from "@/lib/supabase/public-invitation";
import { submitRsvp } from "@/lib/supabase/rsvp";
import { cn } from "@/lib/utils";

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

function generateWhatsAppLink(guestName: string, invitationUrl: string): string {
  const name = guestName || "Tamu Undangan";
  const msg = `Dear ${name},\n\nAnda diundang ke pernikahan kami:\n\n${invitationUrl}\n\nKami sangat mengharapkan kehadiran Anda. 🙏`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function InvitePage() {
  return (
    <Suspense
      fallback={<EnvelopeSkeleton />}
    >
      <InviteContent />
    </Suspense>
  );
}

function EnvelopeSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 animate-pulse" style={{ background: "#f3f0eb" }}>
      <div className="w-full max-w-sm rounded-3xl px-8 py-10" style={{ background: "#fffdf9", border: "1px solid #e8e2d9" }}>
        <div className="mb-8 mx-auto h-2.5 w-40 rounded-full" style={{ background: "#e8e2d9" }} />
        <div className="mb-2 mx-auto h-2 w-20 rounded-full" style={{ background: "#e8e2d9" }} />
        <div className="mb-6 mx-auto h-7 w-56 rounded-full" style={{ background: "#e8e2d9" }} />
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "#e8e2d9" }} />
          <div className="h-4 w-4 rounded-full" style={{ background: "#e8e2d9" }} />
          <div className="h-px flex-1" style={{ background: "#e8e2d9" }} />
        </div>
        <div className="mb-1 mx-auto h-2 w-12 rounded-full" style={{ background: "#e8e2d9" }} />
        <div className="mb-1 mx-auto h-5 w-44 rounded-full" style={{ background: "#e8e2d9" }} />
        <div className="mx-auto h-5 w-44 rounded-full" style={{ background: "#e8e2d9" }} />
        <div className="mt-4 mx-auto h-2 w-36 rounded-full" style={{ background: "#e8e2d9" }} />
      </div>
      <div className="mt-5 h-14 w-full max-w-sm rounded-2xl" style={{ background: "#d4c8b5" }} />
    </div>
  );
}

function InviteContent() {
  const params = useSearchParams();
  const slug = params.get("s") ?? "";
  const guestName = params.get("to") ?? "";
  const isPreview = params.get("preview") === "1";

  const [invite, setInvite] = useState<PublicInvitation | null>(null);
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    const fetcher = isPreview ? getInvitationBySlugPreview : getInvitationBySlug;
    fetcher(slug)
      .then((data) => {
        if (!data) { setNotFound(true); return; }
        setInvite(data);
        return getPublicMessages(data.id);
      })
      .then((msgs) => { if (msgs) setMessages(msgs); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, isPreview]);

  // Lock body scroll while envelope is visible — prevents iOS Safari touch fall-through
  useEffect(() => {
    if (!invite || opened) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [invite, opened]);

  function refreshMessages(id: string) {
    getPublicMessages(id).then(setMessages);
  }

  if (loading) return <EnvelopeSkeleton />;

  if (notFound || !invite) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center"
        style={{ background: "var(--muted)" }}
      >
        <p className="text-lg" style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}>
          Undangan tidak ditemukan
        </p>
        <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
          Tautan mungkin tidak valid atau undangan belum dipublikasikan.
        </p>
      </div>
    );
  }

  return (
    <>
      {isPreview && (
        <div
          className="fixed left-0 right-0 top-0 z-[70] px-4 py-2 text-center text-xs font-medium"
          style={{ background: "#fef3c7", color: "#92400e", fontFamily: "var(--font-inter)" }}
        >
          Mode Preview — undangan belum dipublikasikan
        </div>
      )}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="envelope"
            className={`fixed inset-0 z-[60]${isPreview ? " pt-8" : ""}`}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
          >
            <EnvelopeCover invite={invite} guestName={guestName} onOpen={() => setOpened(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {opened && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <InvitationView
            invite={invite}
            guestName={guestName}
            messages={messages}
            onRsvpSuccess={() => refreshMessages(invite.id)}
            autoPlay={opened}
          />
        </motion.div>
      )}
    </>
  );
}

const TEMPLATE_THEMES: Record<string, { primary: string; muted: string; border: string }> = {
  "garden-bloom":   { primary: "#4a7c59", muted: "#e8f4e8", border: "#c5dfc5" },
  "rustic-gold":    { primary: "#b08d57", muted: "#f3f0eb", border: "#e8e2d9" },
  "modern-minimal": { primary: "#1a1a1a", muted: "#f5f5f5", border: "#e0e0e0" },
  "royal-elegance": { primary: "#6b35a3", muted: "#f5f0fa", border: "#d4b8f0" },
  "floral-dream":   { primary: "#c06080", muted: "#fdf0f5", border: "#f0c0d0" },
};

// ─── Envelope Cover ───────────────────────────────────────────────────────────

function EnvelopeCover({
  invite, guestName, onOpen,
}: {
  invite: PublicInvitation;
  guestName: string;
  onOpen: () => void;
}) {
  const theme = TEMPLATE_THEMES[invite.template_slug ?? "rustic-gold"] ?? TEMPLATE_THEMES["rustic-gold"];
  const inviteUrl = typeof window !== "undefined" ? window.location.href : "";
  const displayName = guestName ? `Bapak/Ibu ${guestName}` : "Tamu Undangan";

  const eventDate = new Date(invite.event_date);
  const dayName = eventDate.toLocaleDateString("id-ID", { weekday: "long" });
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString("id-ID", { month: "long" });
  const year = eventDate.getFullYear();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12" style={{ background: theme.muted }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-10"
          style={{
            background: "linear-gradient(160deg, #fffdf9 0%, #f8f4ee 100%)",
            border: `1px solid ${theme.border}`,
            boxShadow: "0 32px 80px -20px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.75)",
          }}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
            <line x1="0" y1="0" x2="50%" y2="40%" stroke={theme.primary} strokeWidth="1" opacity="0.07" />
            <line x1="100%" y1="0" x2="50%" y2="40%" stroke={theme.primary} strokeWidth="1" opacity="0.07" />
            <line x1="0" y1="100%" x2="50%" y2="60%" stroke={theme.primary} strokeWidth="1" opacity="0.07" />
            <line x1="100%" y1="100%" x2="50%" y2="60%" stroke={theme.primary} strokeWidth="1" opacity="0.07" />
          </svg>

          <p className="mb-8 text-center text-[10px] uppercase tracking-[0.35em]" style={{ color: theme.primary, fontFamily: "var(--font-inter)" }}>
            ✦ &nbsp; Undangan Pernikahan &nbsp; ✦
          </p>

          <div className="mb-6 text-center">
            <p className="mb-1.5 text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              Kepada Yth.
            </p>
            <p className="text-2xl font-bold leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>
              {displayName}
            </p>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: theme.border }} />
            <Heart className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} fill={theme.primary} />
            <div className="h-px flex-1" style={{ background: theme.border }} />
          </div>

          <div className="text-center">
            <p className="mb-2 text-[10px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              Dari
            </p>
            <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>{invite.bride_name}</p>
            <p className="my-1 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>&amp;</p>
            <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>{invite.groom_name}</p>
          </div>

          <p className="mt-4 text-center text-xs tracking-wide" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
            {dayName}, {day} {month} {year}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.45 }}
        className="mt-5 w-full max-w-sm"
      >
        <button
          onClick={onOpen}
          className="flex w-full items-center justify-center gap-3 rounded-2xl text-base font-semibold transition-all duration-200 hover:brightness-110 hover:shadow-xl active:scale-[0.98]"
          style={{
            background: theme.primary,
            color: "#fff",
            fontFamily: "var(--font-inter)",
            minHeight: 56,
            boxShadow: `0 8px 32px -8px ${theme.primary}88`,
          }}
        >
          <Mail className="h-5 w-5" />
          Buka Undangan
        </button>
      </motion.div>

      {inviteUrl && (
        <motion.a
          href={generateWhatsAppLink(guestName, inviteUrl)}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-3 flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#25D366", color: "#fff", fontFamily: "var(--font-inter)" }}
        >
          <WhatsAppIcon className="h-4 w-4" />
          Bagikan via WhatsApp
        </motion.a>
      )}
    </div>
  );
}

// ─── Invitation View ──────────────────────────────────────────────────────────

function InvitationView({
  invite, guestName, messages, onRsvpSuccess, autoPlay,
}: {
  invite: PublicInvitation;
  guestName: string;
  messages: GuestMessage[];
  onRsvpSuccess: () => void;
  autoPlay: boolean;
}) {
  const theme = TEMPLATE_THEMES[invite.template_slug ?? "rustic-gold"] ?? TEMPLATE_THEMES["rustic-gold"];
  const hasCover = !!invite.cover_image_url;

  const eventDate = new Date(invite.event_date);
  const dayName = eventDate.toLocaleDateString("id-ID", { weekday: "long" });
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString("id-ID", { month: "long" });
  const year = eventDate.getFullYear();

  const [timeLeft, setTimeLeft] = useState(getTimeLeft(eventDate));
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(eventDate)), 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  useEffect(() => {
    if (!invite.music_url) return;
    const audio = new Audio(invite.music_url);
    audio.loop = true;
    audioRef.current = audio;
    return () => { audio.pause(); };
  }, [invite.music_url]);

  useEffect(() => {
    if (!autoPlay || !audioRef.current) return;
    audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {});
  }, [autoPlay]);

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicPlaying) { audio.pause(); setMusicPlaying(false); }
    else audio.play().then(() => setMusicPlaying(true)).catch(() => {});
  }

  const displayName = guestName ? `Bapak/Ibu ${guestName}` : null;
  const galleryUrls = [invite.gallery_url_1, invite.gallery_url_2, invite.gallery_url_3].filter(Boolean) as string[];
  const bankAccounts = invite.bank_accounts ?? [];

  // Akad info
  const hasAkad = !!invite.akad_date;
  let akadDay = "", akadDayName = "", akadMonth = "", akadYear = "", akadTime = "";
  if (hasAkad) {
    const akadDate = new Date(invite.akad_date!);
    akadDayName = akadDate.toLocaleDateString("id-ID", { weekday: "long" });
    akadDay = String(akadDate.getDate());
    akadMonth = akadDate.toLocaleDateString("id-ID", { month: "long" });
    akadYear = String(akadDate.getFullYear());
    akadTime = invite.akad_time ? formatTime(invite.akad_time) : "";
  }

  return (
    <main
      className="min-h-screen"
      style={{
        background: "var(--background)",
        // @ts-expect-error css vars override
        "--primary": theme.primary,
        "--muted": theme.muted,
        "--border": theme.border,
      }}
    >
      {/* Floating music toggle */}
      {invite.music_url && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:opacity-80 active:scale-95"
          style={{ background: "var(--primary)", color: "#fff" }}
          aria-label={musicPlaying ? "Pause musik" : "Putar musik"}
        >
          {musicPlaying ? <Music className="h-5 w-5" /> : <Music2 className="h-5 w-5" />}
        </button>
      )}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16"
        style={{ background: hasCover ? "transparent" : "var(--muted)" }}
      >
        {hasCover ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${invite.cover_image_url})` }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.55) 100%)" }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: theme.muted }} />
            <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 35%, rgba(255,255,255,0.9), transparent)" }} />
          </>
        )}
        <Ornament color={theme.primary} />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          {displayName && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8 flex flex-col items-center gap-1">
              <p className="text-xs uppercase tracking-widest" style={{ color: hasCover ? "rgba(255,255,255,0.75)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Kepada Yth.
              </p>
              <p className="text-xl font-semibold" style={{ color: hasCover ? "#fff" : undefined, fontFamily: "var(--font-playfair)" }}>
                {displayName}
              </p>
            </motion.div>
          )}

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mb-3 text-xs uppercase tracking-[0.3em]"
            style={{ color: hasCover ? "rgba(255,255,255,0.85)" : "var(--primary)", fontFamily: "var(--font-inter)" }}>
            Undangan Pernikahan
          </motion.p>

          {/* Bride */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="flex flex-col items-center">
            <h1 className="text-5xl font-bold leading-tight sm:text-6xl" style={{ color: hasCover ? "#fff" : undefined, fontFamily: "var(--font-playfair)" }}>
              {invite.bride_name}
            </h1>
            {(invite.bride_father_name || invite.bride_mother_name) && (
              <p className="mt-1.5 text-xs" style={{ color: hasCover ? "rgba(255,255,255,0.65)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Putri dari {invite.bride_father_name && `Bp. ${invite.bride_father_name}`}
                {invite.bride_father_name && invite.bride_mother_name && " & "}
                {invite.bride_mother_name && `Ibu ${invite.bride_mother_name}`}
              </p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="my-5">
            <Heart className="h-8 w-8" style={{ color: hasCover ? "rgba(255,255,255,0.8)" : "var(--primary)" }} fill="currentColor" />
          </motion.div>

          {/* Groom */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 0.6 }} className="flex flex-col items-center">
            <h1 className="text-5xl font-bold leading-tight sm:text-6xl" style={{ color: hasCover ? "#fff" : undefined, fontFamily: "var(--font-playfair)" }}>
              {invite.groom_name}
            </h1>
            {(invite.groom_father_name || invite.groom_mother_name) && (
              <p className="mt-1.5 text-xs" style={{ color: hasCover ? "rgba(255,255,255,0.65)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Putra dari {invite.groom_father_name && `Bp. ${invite.groom_father_name}`}
                {invite.groom_father_name && invite.groom_mother_name && " & "}
                {invite.groom_mother_name && `Ibu ${invite.groom_mother_name}`}
              </p>
            )}
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}
            className="mt-6 max-w-xs text-sm leading-relaxed"
            style={{ color: hasCover ? "rgba(255,255,255,0.7)" : "var(--muted-foreground)", fontFamily: "var(--font-playfair)", fontStyle: "italic" }}>
            Dengan penuh kebahagiaan, kami mengundang kehadiran Anda
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05 }} className="mt-6 flex items-center gap-3">
            <div className="h-px w-12" style={{ background: hasCover ? "rgba(255,255,255,0.5)" : "var(--primary)", opacity: 0.6 }} />
            <p className="text-sm uppercase tracking-widest" style={{ color: hasCover ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              {dayName}, {day} {month} {year}
            </p>
            <div className="h-px w-12" style={{ background: hasCover ? "rgba(255,255,255,0.5)" : "var(--primary)", opacity: 0.6 }} />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} className="flex flex-col items-center gap-1">
            <div className="h-6 w-px" style={{ background: hasCover ? "rgba(255,255,255,0.6)" : "var(--primary)", opacity: 0.5 }} />
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: hasCover ? "rgba(255,255,255,0.6)" : "var(--primary)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Quote ────────────────────────────────────────────── */}
      {invite.custom_message && (
        <FadeSection>
          <section className="px-6 py-16 text-center">
            <div className="mx-auto max-w-xl">
              <div className="mb-4 text-2xl" style={{ color: "var(--primary)" }}>✦</div>
              <p className="text-base leading-relaxed sm:text-lg" style={{ fontFamily: "var(--font-playfair)", color: "var(--muted-foreground)", fontStyle: "italic" }}>
                &ldquo;{invite.custom_message}&rdquo;
              </p>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── Akad Nikah ───────────────────────────────────────── */}
      {hasAkad && invite.akad_venue_name && (
        <FadeSection>
          <section className="px-6 py-16" style={{ background: "var(--background)" }}>
            <div className="mx-auto max-w-xl">
              <SectionTitle>Akad Nikah</SectionTitle>
              <div className="mt-8 flex flex-col gap-4">
                <DetailRow icon={<Calendar className="h-5 w-5" style={{ color: "var(--primary)" }} />} label="Hari &amp; Tanggal" value={`${akadDayName}, ${akadDay} ${akadMonth} ${akadYear}`} />
                {akadTime && <DetailRow icon={<Clock className="h-5 w-5" style={{ color: "var(--primary)" }} />} label="Waktu" value={akadTime} />}
                <div className="flex gap-4 rounded-xl p-4" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Lokasi Akad</p>
                    <p className="mt-0.5 text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>{invite.akad_venue_name}</p>
                    {invite.akad_venue_address && (
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>{invite.akad_venue_address}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <div className="overflow-hidden rounded-xl" style={{ height: 140, pointerEvents: "none" }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${invite.akad_venue_name} ${invite.akad_venue_address ?? ""}`)}&output=embed&z=15`}
                    width="100%" height="140" style={{ border: 0 }} loading="lazy" aria-hidden="true"
                  />
                </div>
                <a
                  href={`https://maps.google.com?q=${encodeURIComponent(`${invite.akad_venue_name} ${invite.akad_venue_address ?? ""}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-all hover:brightness-110 hover:shadow-lg active:scale-[0.98]"
                  style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-inter)" }}
                >
                  <MapPin className="h-4 w-4" />
                  Buka Google Maps — Akad
                </a>
              </div>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── Resepsi ──────────────────────────────────────────── */}
      <FadeSection>
        <section className="px-6 py-16" style={{ background: "var(--muted)" }}>
          <div className="mx-auto max-w-xl">
            <SectionTitle>{hasAkad ? "Resepsi" : "Waktu & Tempat"}</SectionTitle>
            <div className="mt-8 flex flex-col gap-4">
              <DetailRow icon={<Calendar className="h-5 w-5" style={{ color: "var(--primary)" }} />} label="Hari &amp; Tanggal" value={`${dayName}, ${day} ${month} ${year}`} />
              <DetailRow icon={<Clock className="h-5 w-5" style={{ color: "var(--primary)" }} />} label="Waktu" value={formatTime(invite.event_time)} />
              <div className="flex gap-4 rounded-xl p-4 transition-shadow hover:shadow-md" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Lokasi</p>
                  <p className="mt-0.5 text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>{invite.venue_name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>{invite.venue_address}</p>
                </div>
              </div>

              {/* Dresscode badge */}
              {invite.dresscode && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                  <Shirt className="h-4 w-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Dresscode</p>
                  <p className="ml-auto text-sm font-semibold" style={{ fontFamily: "var(--font-inter)", color: "var(--primary)" }}>{invite.dresscode}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="overflow-hidden rounded-xl" style={{ height: 160, pointerEvents: "none" }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(invite.venue_name + " " + invite.venue_address)}&output=embed&z=15`}
                  width="100%" height="160" style={{ border: 0 }} loading="lazy" aria-hidden="true"
                />
              </div>
              <a
                href={`https://maps.google.com?q=${encodeURIComponent(invite.venue_name + " " + invite.venue_address)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-all hover:brightness-110 hover:shadow-lg active:scale-[0.98]"
                style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-inter)" }}
              >
                <MapPin className="h-4 w-4" />
                Buka Google Maps
              </a>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── Galeri ───────────────────────────────────────────── */}
      {galleryUrls.length > 0 && (
        <FadeSection>
          <section className="px-6 py-16" style={{ background: "var(--background)" }}>
            <div className="mx-auto max-w-xl">
              <SectionTitle>Galeri</SectionTitle>
              <div className={cn("mt-8 grid gap-3", galleryUrls.length === 1 ? "grid-cols-1" : galleryUrls.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
                {galleryUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className={cn("w-full rounded-2xl object-cover", galleryUrls.length === 1 ? "aspect-video" : "aspect-square")}
                  />
                ))}
              </div>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── Countdown ────────────────────────────────────────── */}
      <FadeSection>
        <section className="px-6 py-16 text-center">
          <div className="mx-auto max-w-xl">
            {timeLeft ? (
              <>
                <SectionTitle>Menghitung Hari</SectionTitle>
                <div className="mt-8 grid grid-cols-4 gap-3">
                  {[
                    { value: timeLeft.days,    label: "Hari" },
                    { value: timeLeft.hours,   label: "Jam" },
                    { value: timeLeft.minutes, label: "Menit" },
                    { value: timeLeft.seconds, label: "Detik" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-2 overflow-hidden rounded-2xl py-5"
                      style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                    >
                      <motion.span
                        key={`${item.label}-${item.value}`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className="text-3xl font-bold sm:text-4xl"
                        style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}
                      >
                        {String(item.value).padStart(2, "0")}
                      </motion.span>
                      <span className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionTitle>Hari Istimewa</SectionTitle>
                <p className="mt-6 text-base leading-relaxed" style={{ fontFamily: "var(--font-playfair)", color: "var(--muted-foreground)", fontStyle: "italic" }}>
                  Alhamdulillah, acara pernikahan telah berlangsung dengan lancar. 🙏<br />
                  Terima kasih atas doa dan kehadiran Anda.
                </p>
              </>
            )}
          </div>
        </section>
      </FadeSection>

      {/* ── Hadiah & Angpao ──────────────────────────────────── */}
      {bankAccounts.length > 0 && (
        <FadeSection>
          <section className="px-6 py-16" style={{ background: "var(--muted)" }}>
            <div className="mx-auto max-w-xl">
              <SectionTitle>Hadiah &amp; Angpao</SectionTitle>
              <p className="mt-3 text-center text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Tanpa mengurangi rasa hormat, bagi yang ingin memberikan hadiah, dapat melalui:
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {bankAccounts.map((acc, i) => (
                  <BankCard key={i} bank={acc.bank} accountName={acc.account_name} accountNumber={acc.account_number} />
                ))}
              </div>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── RSVP ─────────────────────────────────────────────── */}
      <FadeSection>
        <RsvpSection
          invitationId={invite.id}
          guestName={guestName}
          inviteUrl={typeof window !== "undefined" ? window.location.href : ""}
          onSuccess={onRsvpSuccess}
        />
      </FadeSection>

      {/* ── Guest messages ───────────────────────────────────── */}
      {messages.length > 0 && (
        <FadeSection>
          <section className="px-6 py-16" style={{ background: "var(--muted)" }}>
            <div className="mx-auto max-w-xl">
              <SectionTitle>Ucapan &amp; Doa</SectionTitle>
              <div className="mt-8 flex flex-col gap-4">
                {messages.map((m) => (
                  <div key={m.id} className="rounded-2xl p-5" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>{m.name}</p>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs"
                        style={{
                          background: m.rsvp_status === "attending" ? "#f0fdf4" : "var(--muted)",
                          color: m.rsvp_status === "attending" ? "#16a34a" : "var(--muted-foreground)",
                          fontFamily: "var(--font-inter)",
                        }}
                      >
                        {m.rsvp_status === "attending" ? "Hadir ✓" : "Tidak Hadir"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)", fontStyle: "italic" }}>
                      &ldquo;{m.message}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="px-6 py-12 text-center" style={{ background: "var(--muted)" }}>
        <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}>
          {invite.bride_name} &amp; {invite.groom_name}
        </p>
        <p className="mt-2 text-xs uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
          {day} {month} {year}
        </p>
        <div className="mx-auto mt-6 h-px w-16" style={{ background: "var(--border)" }} />
        <p className="mt-4 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
          Dibuat dengan ❤️ menggunakan Wedding Invite
        </p>
      </footer>
    </main>
  );
}

// ─── Bank Card ────────────────────────────────────────────────────────────────

function BankCard({ bank, accountName, accountNumber }: { bank: string; accountName: string; accountNumber: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback
      const el = document.createElement("textarea");
      el.value = accountNumber;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-xl p-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "var(--muted)" }}>
        <CreditCard className="h-5 w-5" style={{ color: "var(--primary)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}>{bank}</p>
        <p className="text-lg font-bold tracking-widest" style={{ fontFamily: "var(--font-inter)" }}>{accountNumber}</p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>{accountName}</p>
      </div>
      <button
        onClick={handleCopy}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all hover:opacity-70 active:scale-95"
        style={{ background: "var(--muted)", color: copied ? "#16a34a" : "var(--muted-foreground)" }}
        aria-label="Salin nomor rekening"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── RSVP Section ─────────────────────────────────────────────────────────────

type RsvpState = "idle" | "submitting" | "done" | "error" | "already_submitted";

function RsvpSection({ invitationId, guestName, inviteUrl, onSuccess }: {
  invitationId: string; guestName: string; inviteUrl: string; onSuccess: () => void;
}) {
  const storageKey = `rsvp_${invitationId}`;
  const [name, setName] = useState(guestName);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"attending" | "not_attending">("attending");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<RsvpState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    try { if (localStorage.getItem(storageKey)) setState("already_submitted"); } catch { /* private mode */ }
  }, [storageKey]);

  function validatePhone(v: string): boolean {
    if (!v.trim()) return true;
    const digits = v.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!validatePhone(phone)) { setPhoneError("Nomor WhatsApp tidak valid."); return; }
    setPhoneError("");
    setState("submitting");
    setErrorMsg("");
    try {
      await submitRsvp({ invitation_id: invitationId, name, phone, rsvp_status: status, message });
      try { localStorage.setItem(storageKey, "1"); } catch { /* private mode */ }
      setState("done");
      onSuccess();
    } catch (err) {
      if (err instanceof Error && err.message === "ALREADY_SUBMITTED") {
        setState("already_submitted");
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setState("error");
      }
    }
  }

  const isDone = state === "done" || state === "already_submitted";

  return (
    <section className="px-6 py-16" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-xl">
        <SectionTitle>Konfirmasi Kehadiran</SectionTitle>
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="mt-8 flex flex-col items-center gap-5 rounded-2xl p-8 text-center"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#f0fdf4" }}>
                <CheckCircle className="h-8 w-8" style={{ color: "#16a34a" }} />
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
                  {state === "already_submitted" ? "Konfirmasi sudah diterima!" : `Terima kasih, ${name}!`}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  {state === "already_submitted"
                    ? "Anda sebelumnya telah mengisi konfirmasi kehadiran."
                    : status === "attending"
                      ? "Terima kasih, konfirmasi berhasil! Kami menantikan kehadiran Anda 🎉"
                      : "Terima kasih, konfirmasi berhasil!"}
                </p>
              </div>
              {inviteUrl && (
                <a href={generateWhatsAppLink(guestName, inviteUrl)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#25D366", color: "#fff", fontFamily: "var(--font-inter)" }}>
                  <WhatsAppIcon className="h-4 w-4" />
                  Bagikan via WhatsApp
                </a>
              )}
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { val: "attending",     label: "Hadir ✓" },
                  { val: "not_attending", label: "Tidak Hadir" },
                ] as const).map((opt) => (
                  <button
                    key={opt.val} type="button" onClick={() => setStatus(opt.val)}
                    className={cn("rounded-xl py-3.5 text-sm font-medium transition-all active:scale-[0.98]")}
                    style={{
                      background: status === opt.val ? "var(--primary)" : "var(--muted)",
                      color: status === opt.val ? "#fff" : "var(--muted-foreground)",
                      fontFamily: "var(--font-inter)",
                      border: status === opt.val ? "1px solid var(--primary)" : "1px solid var(--border)",
                    }}
                  >{opt.label}</button>
                ))}
              </div>

              <FormField icon={<User className="h-4 w-4" />} label="Nama" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda" required
                  className="w-full bg-transparent py-0.5 text-sm outline-none placeholder:opacity-50"
                  style={{ fontFamily: "var(--font-inter)" }} />
              </FormField>

              <div className="flex flex-col gap-1">
                <FormField icon={<Phone className="h-4 w-4" />} label="No. WhatsApp (opsional)">
                  <input type="tel" value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }}
                    placeholder="08xxxxxxxxxx"
                    className="w-full bg-transparent py-0.5 text-sm outline-none placeholder:opacity-50"
                    style={{ fontFamily: "var(--font-inter)" }} />
                </FormField>
                {phoneError && <p className="text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>{phoneError}</p>}
              </div>

              <FormField icon={<MessageSquare className="h-4 w-4" />} label="Ucapan &amp; Doa (opsional)">
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis ucapan atau doa untuk pasangan..."
                  rows={3} className="w-full resize-none bg-transparent py-0.5 text-sm outline-none placeholder:opacity-50"
                  style={{ fontFamily: "var(--font-inter)" }} />
              </FormField>

              {state === "error" && (
                <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "#fef2f2", color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={state === "submitting" || !name.trim()}
                className="flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-all duration-200 hover:brightness-110 hover:shadow-lg disabled:opacity-60 active:scale-[0.98]"
                style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-inter)" }}
              >
                {state === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim Konfirmasi"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ icon, label, required, children }: { icon: React.ReactNode; label: string; required?: boolean; children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex gap-3 rounded-xl px-4 py-3.5 transition-all duration-150"
      style={{ background: "var(--muted)", border: focused ? "1.5px solid var(--primary)" : "1px solid var(--border)", boxShadow: focused ? "0 0 0 3px rgba(0,0,0,0.07)" : "none" }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="mt-0.5 flex-shrink-0" style={{ color: "var(--primary)" }}>{icon}</div>
      <div className="flex flex-1 flex-col gap-0.5">
        <label className="text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
          {label}{required && <span style={{ color: "var(--primary)" }}> *</span>}
        </label>
        {children}
      </div>
    </div>
  );
}

function Ornament({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" width="600" height="600" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="90" stroke={color} strokeWidth="0.5" />
        <circle cx="100" cy="100" r="70" stroke={color} strokeWidth="0.5" />
        <circle cx="100" cy="100" r="50" stroke={color} strokeWidth="0.5" />
        <line x1="10" y1="100" x2="190" y2="100" stroke={color} strokeWidth="0.5" />
        <line x1="100" y1="10" x2="100" y2="190" stroke={color} strokeWidth="0.5" />
        <line x1="29" y1="29" x2="171" y2="171" stroke={color} strokeWidth="0.5" />
        <line x1="171" y1="29" x2="29" y2="171" stroke={color} strokeWidth="0.5" />
      </svg>
    </div>
  );
}

function FadeSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}>{children}</p>
      <div className="h-px w-16" style={{ background: "var(--primary)", opacity: 0.3 }} />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-4 rounded-xl p-4 transition-shadow hover:shadow-md" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>{label}</p>
        <p className="mt-0.5 text-sm" style={{ fontFamily: "var(--font-inter)" }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const period = hour < 12 ? "Pagi" : hour < 15 ? "Siang" : hour < 18 ? "Sore" : "Malam";
  return `${h}.${m} WIB (${period})`;
}

function getTimeLeft(target: Date) {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}
