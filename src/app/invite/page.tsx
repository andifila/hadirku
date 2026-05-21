"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Clock, Heart, Loader2, CheckCircle,
  Phone, MessageSquare, User, Music, Music2, Mail, Shirt,
  CreditCard, Copy, Check, QrCode, Users, Package,
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

// ─── Icons ────────────────────────────────────────────────────────────────────

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function igHandle(raw: string): string {
  return raw.replace(/^@/, "");
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function InvitePage() {
  return (
    <Suspense fallback={<EnvelopeSkeleton />}>
      <InviteContent />
    </Suspense>
  );
}

function EnvelopeSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 animate-pulse" style={{ background: "#f3f0eb" }}>
      <div className="w-full max-w-xs px-10 py-14" style={{ background: "#fffdf9", border: "1px solid #e8e2d9" }}>
        <div className="mb-10 mx-auto h-2 w-32" style={{ background: "#e8e2d9" }} />
        <div className="mb-2 mx-auto h-1.5 w-16" style={{ background: "#e8e2d9" }} />
        <div className="mb-6 mx-auto h-8 w-52" style={{ background: "#e8e2d9" }} />
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "#e8e2d9" }} />
          <div className="h-1 w-1 rounded-full" style={{ background: "#e8e2d9" }} />
          <div className="h-px flex-1" style={{ background: "#e8e2d9" }} />
        </div>
        <div className="mb-1 mx-auto h-1.5 w-10" style={{ background: "#e8e2d9" }} />
        <div className="mb-1 mx-auto h-7 w-44" style={{ background: "#e8e2d9" }} />
        <div className="mx-auto h-7 w-44" style={{ background: "#e8e2d9" }} />
        <div className="mt-5 mx-auto h-1.5 w-32" style={{ background: "#e8e2d9" }} />
      </div>
      <div className="mt-5 h-12 w-full max-w-xs" style={{ background: "#d4c8b5" }} />
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
  const [showConfetti, setShowConfetti] = useState(false);

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" style={{ background: "var(--muted)" }}>
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
        <div className="fixed left-0 right-0 top-0 z-[70] px-4 py-2 text-center text-xs font-medium" style={{ background: "#fef3c7", color: "#92400e", fontFamily: "var(--font-inter)" }}>
          Mode Preview — undangan belum dipublikasikan
        </div>
      )}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="envelope"
            className={`fixed inset-0 z-[60]${isPreview ? " pt-8" : ""}`}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
          >
            <EnvelopeCover invite={invite} guestName={guestName} onOpen={() => { setOpened(true); setShowConfetti(true); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {showConfetti && (
        <ConfettiBurst onComplete={() => setShowConfetti(false)} />
      )}

      {opened && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
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

const TEMPLATE_THEMES: Record<string, { primary: string; muted: string; border: string; gradient: string }> = {
  "garden-bloom":   { primary: "#4a7c59", muted: "#e8f4e8", border: "#c5dfc5", gradient: "linear-gradient(135deg, #4a7c59 0%, #3a6347 100%)" },
  "rustic-gold":    { primary: "#b08d57", muted: "#f3f0eb", border: "#e8e2d9", gradient: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)" },
  "modern-minimal": { primary: "#1a1a1a", muted: "#f5f5f5", border: "#e0e0e0", gradient: "linear-gradient(135deg, #333333 0%, #1a1a1a 100%)" },
  "royal-elegance": { primary: "#6b35a3", muted: "#f5f0fa", border: "#d4b8f0", gradient: "linear-gradient(135deg, #6b35a3 0%, #582d8a 100%)" },
  "floral-dream":   { primary: "#c06080", muted: "#fdf0f5", border: "#f0c0d0", gradient: "linear-gradient(135deg, #c06080 0%, #a84e6b 100%)" },
};

// ─── Envelope Cover ───────────────────────────────────────────────────────────

function EnvelopeCover({ invite, guestName, onOpen }: { invite: PublicInvitation; guestName: string; onOpen: () => void }) {
  const theme = TEMPLATE_THEMES[invite.template_slug ?? "rustic-gold"] ?? TEMPLATE_THEMES["rustic-gold"];
  const displayName = guestName ? `Bapak/Ibu ${guestName}` : "Tamu Undangan";

  const eventDate = new Date(invite.event_date);
  const dayName = eventDate.toLocaleDateString("id-ID", { weekday: "long" });
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString("id-ID", { month: "long" });
  const year = eventDate.getFullYear();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12" style={{ background: theme.muted }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xs"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="relative overflow-hidden px-10 py-14"
            style={{
              background: "linear-gradient(160deg, #fffdf9 0%, #f8f4ee 100%)",
              border: `1px solid ${theme.border}`,
              boxShadow: "0 40px 100px -24px rgba(0,0,0,0.16), 0 0 0 1px rgba(255,255,255,0.8)",
            }}
          >
            <p className="mb-10 text-center text-[9px] uppercase tracking-[0.4em]" style={{ color: theme.primary, fontFamily: "var(--font-inter)" }}>
              Undangan Pernikahan
            </p>

            <div className="mb-7 text-center">
              <p className="mb-1 text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Kepada Yth.
              </p>
              <p className="text-[22px] font-bold leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>
                {displayName}
              </p>
            </div>

            <div className="mb-7 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: theme.border }} />
              <div className="h-1 w-1 rounded-full" style={{ background: theme.primary }} />
              <div className="h-px flex-1" style={{ background: theme.border }} />
            </div>

            <div className="text-center">
              <p className="mb-2 text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Dari
              </p>
              <p className="text-xl font-semibold leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>{invite.bride_name}</p>
              <p className="my-1.5 text-[10px] tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>&amp;</p>
              <p className="text-xl font-semibold leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>{invite.groom_name}</p>
            </div>

            <p className="mt-6 text-center text-[10px] tracking-wide" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              {dayName}, {day} {month} {year}
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 w-full max-w-xs"
      >
        <motion.button
          onClick={onOpen}
          whileHover={{ opacity: 0.85 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="w-full py-4 text-[11px] uppercase tracking-[0.25em] font-medium"
          style={{
            background: theme.primary,
            color: "#fff",
            fontFamily: "var(--font-inter)",
            borderRadius: 0,
          }}
        >
          Buka Undangan
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── Invitation View ──────────────────────────────────────────────────────────

function InvitationView({ invite, guestName, messages, onRsvpSuccess, autoPlay }: {
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
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const coverParallaxY = useTransform(heroScroll, [0, 1], ["0%", "30%"]);

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

  const hasBrideIg = !!invite.bride_instagram;
  const hasGroomIg = !!invite.groom_instagram;

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
        <div className="fixed bottom-6 right-6 z-40">
          {musicPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 2], opacity: [0.4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              style={{ background: "var(--primary)" }}
            />
          )}
          <motion.button
            onClick={toggleMusic}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative flex h-11 w-11 items-center justify-center rounded-full shadow-lg"
            style={{ background: "var(--primary)", color: "#fff" }}
            aria-label={musicPlaying ? "Pause musik" : "Putar musik"}
          >
            {musicPlaying ? <Music className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
          </motion.button>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20"
        style={{ background: hasCover ? "transparent" : "var(--muted)" }}
      >
        {hasCover ? (
          <>
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${invite.cover_image_url})`, y: coverParallaxY }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.6) 100%)" }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(140deg, ${theme.muted} 0%, #fffdf9 52%, ${theme.muted} 100%)` }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(255,255,255,0.95), transparent)" }} />
            <div className="pointer-events-none absolute" style={{ width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${theme.primary}22 0%, transparent 65%)`, top: "-8%", left: "-16%", filter: "blur(40px)" }} />
          </>
        )}
        <HeroOrnament color={theme.primary} />

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          {displayName && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-12 flex flex-col items-center gap-1.5">
              <p className="text-[9px] uppercase tracking-[0.4em]" style={{ color: hasCover ? "rgba(255,255,255,0.6)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Kepada Yth.
              </p>
              <p className="text-lg font-medium italic" style={{ color: hasCover ? "rgba(255,255,255,0.95)" : "var(--foreground)", fontFamily: "var(--font-playfair)" }}>
                {displayName}
              </p>
              <div className="mt-1.5 h-px w-10" style={{ background: hasCover ? "rgba(255,255,255,0.25)" : "var(--border)" }} />
            </motion.div>
          )}

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.8 }}
            className="mb-5 text-[9px] uppercase tracking-[0.4em]"
            style={{ color: hasCover ? "rgba(255,255,255,0.7)" : "var(--primary)", fontFamily: "var(--font-inter)" }}>
            Undangan Pernikahan
          </motion.p>

          {/* Bride */}
          <div className="flex flex-col items-center">
            <h1 className="text-5xl font-bold leading-none sm:text-6xl" style={{ color: hasCover ? "#fff" : undefined, fontFamily: "var(--font-playfair)" }}>
              <LetterReveal text={invite.bride_name} delay={0.5} />
            </h1>
            {invite.bride_title && (
              <p className="mt-2 text-xs font-medium tracking-wider uppercase" style={{ color: hasCover ? "rgba(255,255,255,0.7)" : "var(--primary)", fontFamily: "var(--font-inter)" }}>
                {invite.bride_title}
              </p>
            )}
            {(invite.bride_father_name || invite.bride_mother_name) && (
              <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: hasCover ? "rgba(255,255,255,0.55)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Putri dari {invite.bride_father_name && `Bp. ${invite.bride_father_name}`}
                {invite.bride_father_name && invite.bride_mother_name && " & "}
                {invite.bride_mother_name && `Ibu ${invite.bride_mother_name}`}
              </p>
            )}
            {hasBrideIg && (
              <a
                href={`https://instagram.com/${igHandle(invite.bride_instagram!)}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-[10px] transition-opacity hover:opacity-60"
                style={{ color: hasCover ? "rgba(255,255,255,0.55)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
              >
                <InstagramIcon className="h-3 w-3" />
                @{igHandle(invite.bride_instagram!)}
              </a>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.75, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="my-8 flex items-center gap-5"
          >
            <div className="h-px w-14" style={{ background: hasCover ? "rgba(255,255,255,0.25)" : "var(--border)" }} />
            <Heart className="h-5 w-5 flex-shrink-0" style={{ color: hasCover ? "rgba(255,255,255,0.7)" : "var(--primary)" }} fill="currentColor" />
            <div className="h-px w-14" style={{ background: hasCover ? "rgba(255,255,255,0.25)" : "var(--border)" }} />
          </motion.div>

          {/* Groom */}
          <div className="flex flex-col items-center">
            <h1 className="text-5xl font-bold leading-none sm:text-6xl" style={{ color: hasCover ? "#fff" : undefined, fontFamily: "var(--font-playfair)" }}>
              <LetterReveal text={invite.groom_name} delay={0.82} />
            </h1>
            {invite.groom_title && (
              <p className="mt-2 text-xs font-medium tracking-wider uppercase" style={{ color: hasCover ? "rgba(255,255,255,0.7)" : "var(--primary)", fontFamily: "var(--font-inter)" }}>
                {invite.groom_title}
              </p>
            )}
            {(invite.groom_father_name || invite.groom_mother_name) && (
              <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: hasCover ? "rgba(255,255,255,0.55)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Putra dari {invite.groom_father_name && `Bp. ${invite.groom_father_name}`}
                {invite.groom_father_name && invite.groom_mother_name && " & "}
                {invite.groom_mother_name && `Ibu ${invite.groom_mother_name}`}
              </p>
            )}
            {hasGroomIg && (
              <a
                href={`https://instagram.com/${igHandle(invite.groom_instagram!)}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-[10px] transition-opacity hover:opacity-60"
                style={{ color: hasCover ? "rgba(255,255,255,0.55)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
              >
                <InstagramIcon className="h-3 w-3" />
                @{igHandle(invite.groom_instagram!)}
              </a>
            )}
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95, duration: 0.8 }}
            className="mt-8 max-w-[260px] text-sm leading-loose"
            style={{ color: hasCover ? "rgba(255,255,255,0.65)" : "var(--muted-foreground)", fontFamily: "var(--font-playfair)", fontStyle: "italic" }}>
            Dengan penuh kebahagiaan, kami mengundang kehadiran Anda
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-7 flex items-center gap-4">
            <div className="h-px w-10" style={{ background: hasCover ? "rgba(255,255,255,0.3)" : "var(--border)" }} />
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: hasCover ? "rgba(255,255,255,0.7)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
              {dayName}, {day} {month} {year}
            </p>
            <div className="h-px w-10" style={{ background: hasCover ? "rgba(255,255,255,0.3)" : "var(--border)" }} />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1.5">
            <div className="h-8 w-px" style={{ background: hasCover ? "rgba(255,255,255,0.4)" : "var(--primary)", opacity: 0.5 }} />
            <div className="h-1 w-1 rounded-full" style={{ background: hasCover ? "rgba(255,255,255,0.5)" : "var(--primary)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Quote ────────────────────────────────────────────── */}
      {invite.custom_message && (
        <FadeSection>
          <section className="px-6 py-24 text-center" style={{ backgroundColor: "var(--background)" }}>
            <div className="mx-auto max-w-md">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl leading-[1.7] sm:text-3xl"
                style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)", fontStyle: "italic" }}
              >
                &ldquo;{invite.custom_message}&rdquo;
              </motion.p>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── Akad Nikah ───────────────────────────────────────── */}
      {hasAkad && invite.akad_venue_name && (
        <FadeSection>
          <section className="px-6 py-20" style={{ backgroundColor: "var(--muted)" }}>
            <div className="mx-auto max-w-sm">
              <SectionTitle>Akad Nikah</SectionTitle>
              <div className="mt-14">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <p style={{
                    fontFamily: "var(--font-playfair)",
                    color: "var(--primary)",
                    fontSize: "5.5rem",
                    lineHeight: 1,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}>{akadDay}</p>
                  <p className="mt-1 text-xl tracking-[0.08em]" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
                    {akadMonth} {akadYear}
                  </p>
                  <p className="mt-2 text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    {akadDayName}
                  </p>
                </motion.div>

                <div className="my-10 flex items-center gap-4">
                  <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                  <div className="h-1 w-1 rounded-full" style={{ background: "var(--primary)" }} />
                  <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3 text-center"
                >
                  {akadTime && (
                    <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>{akadTime}</p>
                  )}
                  <p className="text-xl font-semibold leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>
                    {invite.akad_venue_name}
                  </p>
                  {invite.akad_venue_address && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      {invite.akad_venue_address}
                    </p>
                  )}
                  {invite.dresscode && (
                    <p className="pt-1 text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      Dresscode — <span style={{ color: "var(--primary)", fontWeight: 600 }}>{invite.dresscode}</span>
                    </p>
                  )}
                </motion.div>

                <div className="mt-10 flex flex-col gap-3">
                  <div className="overflow-hidden" style={{ height: 168, borderRadius: 8 }}>
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(`${invite.akad_venue_name} ${invite.akad_venue_address ?? ""}`)}&output=embed&z=15`}
                      width="100%" height="168" style={{ border: 0 }} loading="lazy" aria-hidden="true"
                    />
                  </div>
                  <motion.a
                    href={`https://maps.google.com?q=${encodeURIComponent(`${invite.akad_venue_name} ${invite.akad_venue_address ?? ""}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    whileHover={{ opacity: 0.85 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center gap-2 py-3.5 text-[10px] uppercase tracking-[0.2em] font-medium"
                    style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-inter)", borderRadius: 4 }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Buka Peta — Akad
                  </motion.a>
                </div>
              </div>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── Resepsi ──────────────────────────────────────────── */}
      <FadeSection>
        <section className="px-6 py-20" style={{ backgroundColor: hasAkad ? "var(--background)" : "var(--muted)" }}>
          <div className="mx-auto max-w-sm">
            <SectionTitle>{hasAkad ? "Resepsi" : "Waktu & Tempat"}</SectionTitle>
            <div className="mt-14">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <p style={{
                  fontFamily: "var(--font-playfair)",
                  color: "var(--primary)",
                  fontSize: "5.5rem",
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}>{day}</p>
                <p className="mt-1 text-xl tracking-[0.08em]" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
                  {month} {year}
                </p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  {dayName}
                </p>
              </motion.div>

              <div className="my-10 flex items-center gap-4">
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
                <div className="h-1 w-1 rounded-full" style={{ background: "var(--primary)" }} />
                <div className="h-px flex-1" style={{ background: "var(--border)" }} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-3 text-center"
              >
                <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  {formatTime(invite.event_time)}
                </p>
                <p className="text-xl font-semibold leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>
                  {invite.venue_name}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  {invite.venue_address}
                </p>
                {invite.dresscode && !hasAkad && (
                  <p className="pt-1 text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                    Dresscode — <span style={{ color: "var(--primary)", fontWeight: 600 }}>{invite.dresscode}</span>
                  </p>
                )}
              </motion.div>

              <div className="mt-10 flex flex-col gap-3">
                <div className="overflow-hidden" style={{ height: 168, borderRadius: 8 }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(invite.venue_name + " " + invite.venue_address)}&output=embed&z=15`}
                    width="100%" height="168" style={{ border: 0 }} loading="lazy" aria-hidden="true"
                  />
                </div>
                <motion.a
                  href={`https://maps.google.com?q=${encodeURIComponent(invite.venue_name + " " + invite.venue_address)}`}
                  target="_blank" rel="noopener noreferrer"
                  whileHover={{ opacity: 0.85 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center gap-2 py-3.5 text-[10px] uppercase tracking-[0.2em] font-medium"
                  style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-inter)", borderRadius: 4 }}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Buka Google Maps
                </motion.a>
              </div>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── Galeri ───────────────────────────────────────────── */}
      {galleryUrls.length > 0 && (
        <FadeSection>
          <section className="px-4 py-20 sm:px-6" style={{ backgroundColor: hasAkad ? "var(--muted)" : "var(--background)" }}>
            <div className="mx-auto max-w-xl">
              <SectionTitle>Galeri</SectionTitle>
              <div className="mt-12">
                {galleryUrls.length === 3 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-2"
                    style={{ gridTemplateColumns: "2fr 1fr", gridTemplateRows: "200px 200px" }}
                  >
                    <div className="row-span-2 overflow-hidden" style={{ borderRadius: 6 }}>
                      <img src={galleryUrls[0]} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                      style={{ borderRadius: 6 }}
                    >
                      <img src={galleryUrls[1]} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                      style={{ borderRadius: 6 }}
                    >
                      <img src={galleryUrls[2]} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                    </motion.div>
                  </motion.div>
                ) : galleryUrls.length === 2 ? (
                  <div className="flex items-start gap-2">
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-1 overflow-hidden"
                      style={{ height: 320, borderRadius: 6 }}
                    >
                      <img src={galleryUrls[0]} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-1 overflow-hidden"
                      style={{ height: 320, marginTop: 48, borderRadius: 6 }}
                    >
                      <img src={galleryUrls[1]} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="aspect-video overflow-hidden"
                    style={{ borderRadius: 6 }}
                  >
                    <img src={galleryUrls[0]} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
                  </motion.div>
                )}
              </div>
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── Countdown ────────────────────────────────────────── */}
      <FadeSection>
        <section className="relative overflow-hidden px-6 py-24 text-center" style={{ background: "var(--primary)" }}>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <svg width="600" height="600" viewBox="0 0 200 200" fill="none" opacity="0.05">
              <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="65" stroke="white" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="40" stroke="white" strokeWidth="0.5" />
              <line x1="10" y1="100" x2="190" y2="100" stroke="white" strokeWidth="0.5" />
              <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="relative z-10 mx-auto max-w-lg">
            {timeLeft ? (
              <>
                <p className="mb-1 text-[9px] uppercase tracking-[0.4em]" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-inter)" }}>
                  Menghitung Hari
                </p>
                <p className="mb-12 text-xs italic" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-playfair)" }}>
                  {dayName}, {day} {month} {year}
                </p>
                <div className="flex items-end justify-center gap-1 sm:gap-2">
                  {[
                    { value: timeLeft.days,    label: "Hari" },
                    { value: timeLeft.hours,   label: "Jam" },
                    { value: timeLeft.minutes, label: "Menit" },
                    { value: timeLeft.seconds, label: "Detik" },
                  ].map((item, idx) => (
                    <div key={item.label} className="flex items-end gap-1 sm:gap-2">
                      <div className="flex flex-col items-center gap-2">
                        <motion.span
                          key={`${item.label}-${item.value}`}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          className="text-4xl font-bold leading-none sm:text-5xl"
                          style={{ fontFamily: "var(--font-playfair)", color: "#fff" }}
                        >
                          {String(item.value).padStart(2, "0")}
                        </motion.span>
                        <span className="text-[8px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.38)", fontFamily: "var(--font-inter)" }}>
                          {item.label}
                        </span>
                      </div>
                      {idx < 3 && (
                        <span className="mb-7 text-2xl font-thin leading-none" style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)", color: "#fff" }}>Hari Istimewa</p>
                <p className="mt-4 text-base leading-relaxed" style={{ fontFamily: "var(--font-playfair)", color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>
                  Alhamdulillah, acara pernikahan telah berlangsung dengan lancar.<br />
                  Terima kasih atas doa dan kehadiran Anda.
                </p>
              </>
            )}
          </div>
        </section>
      </FadeSection>

      {/* ── Hadiah & Angpao ──────────────────────────────────── */}
      {(bankAccounts.length > 0 || invite.gift_address) && (
        <FadeSection>
          <section className="px-6 py-20" style={{ backgroundColor: "var(--muted)" }}>
            <div className="mx-auto max-w-sm">
              <SectionTitle>Hadiah &amp; Angpao</SectionTitle>
              <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                Tanpa mengurangi rasa hormat, bagi yang ingin memberikan hadiah:
              </p>

              {bankAccounts.length > 0 && (
                <motion.div
                  className="mt-8"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
                >
                  {bankAccounts.map((acc, i) => (
                    <motion.div
                      key={i}
                      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                    >
                      <BankCard
                        bank={acc.bank}
                        accountName={acc.account_name}
                        accountNumber={acc.account_number}
                        qrisUrl={acc.qris_url}
                        isLast={i === bankAccounts.length - 1 && !invite.gift_address}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {invite.gift_address && (
                <div className="mt-4 flex gap-3 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <Package className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>Alamat Pengiriman</p>
                    <p className="mt-1 text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)" }}>{invite.gift_address}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </FadeSection>
      )}

      {/* ── RSVP ─────────────────────────────────────────────── */}
      <FadeSection>
        <RsvpSection
          invite={invite}
          guestName={guestName}
          onSuccess={onRsvpSuccess}
        />
      </FadeSection>

      {/* ── Guest messages ───────────────────────────────────── */}
      {messages.length > 0 && (
        <FadeSection>
          <section className="overflow-hidden py-20" style={{ backgroundColor: "var(--muted)" }}>
            <div className="mb-12 text-center">
              <SectionTitle>Ucapan &amp; Doa</SectionTitle>
            </div>
            <MessageMarquee messages={messages} />
          </section>
        </FadeSection>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="px-6 py-16 text-center" style={{ backgroundColor: "var(--background)" }}>
        <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
          {invite.bride_name} &amp; {invite.groom_name}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
          {day} {month} {year}
        </p>

        {(hasBrideIg || hasGroomIg) && (
          <div className="mt-6 flex items-center justify-center gap-4">
            {hasBrideIg && (
              <a
                href={`https://instagram.com/${igHandle(invite.bride_instagram!)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60"
                style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
              >
                <InstagramIcon className="h-3.5 w-3.5" />
                @{igHandle(invite.bride_instagram!)}
              </a>
            )}
            {hasBrideIg && hasGroomIg && (
              <div className="h-3 w-px" style={{ background: "var(--border)" }} />
            )}
            {hasGroomIg && (
              <a
                href={`https://instagram.com/${igHandle(invite.groom_instagram!)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60"
                style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
              >
                <InstagramIcon className="h-3.5 w-3.5" />
                @{igHandle(invite.groom_instagram!)}
              </a>
            )}
          </div>
        )}

        <div className="mx-auto mt-10 h-px w-10" style={{ background: "var(--border)" }} />
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)", opacity: 0.6 }}>
          Wedding Invite
        </p>
      </footer>
    </main>
  );
}

// ─── Bank Card ────────────────────────────────────────────────────────────────

function BankCard({ bank, accountName, accountNumber, qrisUrl, isLast }: {
  bank: string; accountName: string; accountNumber: string; qrisUrl?: string; isLast?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showQris, setShowQris] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
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
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
      <div className="flex items-center gap-4 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>{bank}</p>
          <p className="mt-1 text-lg font-bold tracking-[0.12em]" style={{ fontFamily: "var(--font-inter)" }}>{accountNumber}</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>{accountName}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {qrisUrl && (
            <motion.button
              onClick={() => setShowQris(!showQris)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex h-8 w-8 items-center justify-center"
              style={{
                background: showQris ? "var(--primary)" : "transparent",
                border: `1px solid ${showQris ? "var(--primary)" : "var(--border)"}`,
                borderRadius: 4,
                color: showQris ? "#fff" : "var(--muted-foreground)",
              }}
              aria-label="Lihat QRIS"
            >
              <QrCode className="h-3.5 w-3.5" />
            </motion.button>
          )}
          <motion.button
            onClick={handleCopy}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex h-8 w-8 items-center justify-center"
            style={{
              background: "transparent",
              border: `1px solid ${copied ? "#16a34a" : "var(--border)"}`,
              borderRadius: 4,
              color: copied ? "#16a34a" : "var(--muted-foreground)",
            }}
            aria-label="Salin nomor rekening"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </motion.button>
        </div>
      </div>
      {qrisUrl && showQris && (
        <div className="pb-6">
          <img src={qrisUrl} alt="QRIS" className="mx-auto max-h-60 w-auto object-contain" />
          <p className="mt-2 text-center text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
            Scan QRIS
          </p>
        </div>
      )}
    </div>
  );
}

// ─── RSVP Section ─────────────────────────────────────────────────────────────

type RsvpState = "idle" | "submitting" | "done" | "error" | "already_submitted";

function RsvpSection({ invite, guestName, onSuccess }: {
  invite: PublicInvitation; guestName: string; onSuccess: () => void;
}) {
  const storageKey = `rsvp_${invite.id}`;
  const theme = TEMPLATE_THEMES[invite.template_slug ?? "rustic-gold"] ?? TEMPLATE_THEMES["rustic-gold"];
  const [name, setName] = useState(guestName);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"attending" | "not_attending">("attending");
  const [guestCount, setGuestCount] = useState(1);
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
      await submitRsvp({
        invitation_id: invite.id,
        name,
        phone,
        rsvp_status: status,
        message,
        guest_count: status === "attending" ? guestCount : undefined,
      });
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
    <section className="px-6 py-20" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-sm">
        <SectionTitle>Konfirmasi Kehadiran</SectionTitle>
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 flex flex-col items-center gap-4 text-center py-10">
              <CheckCircle className="h-9 w-9" style={{ color: "var(--primary)" }} />
              <div>
                <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
                  {state === "already_submitted" ? "Konfirmasi sudah diterima" : `Terima kasih, ${name}`}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  {state === "already_submitted"
                    ? "Anda sebelumnya telah mengisi konfirmasi kehadiran."
                    : status === "attending"
                      ? `Kami menantikan kehadiran Anda${guestCount > 1 ? ` bersama ${guestCount} orang` : ""}.`
                      : "Terima kasih, konfirmasi berhasil dicatat."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit}
              className="mt-10 flex flex-col">

              {/* Attendance toggle */}
              <div className="flex items-center gap-8 pb-8" style={{ borderBottom: "1px solid var(--border)" }}>
                {([
                  { val: "attending",     label: "Hadir" },
                  { val: "not_attending", label: "Tidak Hadir" },
                ] as const).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setStatus(opt.val)}
                    className="flex items-center gap-2.5"
                  >
                    <div
                      className="h-4 w-4 rounded-full border-2 transition-all duration-200"
                      style={{
                        borderColor: "var(--primary)",
                        background: status === opt.val ? "var(--primary)" : "transparent",
                      }}
                    />
                    <span
                      className="text-sm transition-colors duration-200"
                      style={{
                        fontFamily: "var(--font-inter)",
                        color: status === opt.val ? "var(--foreground)" : "var(--muted-foreground)",
                        fontWeight: status === opt.val ? 500 : 400,
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Name */}
              <ElegantField label="Nama" required focused={false}>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda" required
                  className="w-full bg-transparent py-0.5 text-sm outline-none placeholder:opacity-40"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </ElegantField>

              {/* Guest count */}
              {status === "attending" && (
                <div className="flex items-center justify-between py-5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      Jumlah Tamu
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      whileTap={{ scale: 0.88 }}
                      className="flex h-7 w-7 items-center justify-center text-base"
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        color: "var(--muted-foreground)",
                        background: "transparent",
                      }}
                    >−</motion.button>
                    <span className="w-4 text-center text-base font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>
                      {guestCount}
                    </span>
                    <motion.button
                      type="button"
                      onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                      whileTap={{ scale: 0.88 }}
                      className="flex h-7 w-7 items-center justify-center text-base"
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        color: "var(--muted-foreground)",
                        background: "transparent",
                      }}
                    >+</motion.button>
                  </div>
                </div>
              )}

              {/* Phone */}
              <ElegantField label="No. WhatsApp (opsional)" focused={false}>
                <input
                  type="tel" value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(""); }}
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-transparent py-0.5 text-sm outline-none placeholder:opacity-40"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </ElegantField>
              {phoneError && (
                <p className="mt-1 text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>{phoneError}</p>
              )}

              {/* Message */}
              <ElegantField label="Ucapan & Doa (opsional)" focused={false}>
                <textarea
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis ucapan atau doa untuk pasangan..."
                  rows={3}
                  className="w-full resize-none bg-transparent py-0.5 text-sm outline-none placeholder:opacity-40"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </ElegantField>

              {state === "error" && (
                <p className="mt-2 text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>{errorMsg}</p>
              )}

              <motion.button
                type="submit"
                disabled={state === "submitting" || !name.trim()}
                whileHover={state !== "submitting" && !!name.trim() ? { opacity: 0.85 } : undefined}
                whileTap={state !== "submitting" && !!name.trim() ? { scale: 0.99 } : undefined}
                transition={{ duration: 0.15 }}
                className="mt-8 flex w-full items-center justify-center py-4 text-[10px] uppercase tracking-[0.25em] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: theme.primary, color: "#fff", fontFamily: "var(--font-inter)", borderRadius: 4 }}
              >
                {state === "submitting"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : "Kirim Konfirmasi"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── ElegantField ─────────────────────────────────────────────────────────────

function ElegantField({ label, required, children, focused: _focused }: {
  label: string; required?: boolean; children: React.ReactNode; focused?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="py-4 transition-colors duration-200"
      style={{ borderBottom: `1px solid ${focused ? "var(--primary)" : "var(--border)"}` }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <label
        className="mb-1.5 block text-[9px] uppercase tracking-[0.25em] transition-colors duration-200"
        style={{ color: focused ? "var(--primary)" : "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
      >
        {label}{required && <span style={{ color: "var(--primary)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroOrnament({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.svg
        animate={{ rotate: 360 }}
        transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        width="700" height="700" viewBox="0 0 200 200" fill="none"
        style={{ opacity: 0.05, originX: "50%", originY: "50%" }}
      >
        <circle cx="100" cy="100" r="90" stroke={color} strokeWidth="0.5" />
        <circle cx="100" cy="100" r="68" stroke={color} strokeWidth="0.5" />
        <circle cx="100" cy="100" r="46" stroke={color} strokeWidth="0.5" />
        <line x1="10" y1="100" x2="190" y2="100" stroke={color} strokeWidth="0.5" />
        <line x1="100" y1="10" x2="100" y2="190" stroke={color} strokeWidth="0.5" />
        <line x1="29" y1="29" x2="171" y2="171" stroke={color} strokeWidth="0.5" />
        <line x1="171" y1="29" x2="29" y2="171" stroke={color} strokeWidth="0.5" />
      </motion.svg>
    </div>
  );
}

function FadeSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="h-px w-10"
        style={{ background: "var(--primary)", transformOrigin: "center" }}
      />
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="text-3xl font-bold sm:text-4xl"
        style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}
      >
        {children}
      </motion.h2>
    </div>
  );
}

// ─── ConfettiBurst ────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#b08d57", "#c06080", "#4a7c59", "#6b35a3", "#e8c98a", "#f8f4ee", "#d4b8f0", "#c5dfc5"];

function ConfettiBurst({ onComplete }: { onComplete: () => void }) {
  const particles = Array.from({ length: 64 }, (_, i) => {
    const angle = (i / 64) * 360 + (Math.random() - 0.5) * 18;
    const dist = 90 + Math.random() * 220;
    const rad = (angle * Math.PI) / 180;
    return {
      id: i,
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist - 60,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + (i % 5) * 3,
      rotation: Math.random() * 720 - 360,
      shape: i % 3,
      delay: Math.random() * 0.12,
    };
  });

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[65] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.3, duration: 0.6 }}
      onAnimationComplete={onComplete}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.tx, y: p.ty, scale: [0, 1, 1], rotate: p.rotation, opacity: [1, 1, 0.3] }}
          transition={{ duration: 1.1, delay: p.delay, ease: [0.2, 0.8, 0.35, 1] }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.shape === 1 ? p.size * 0.45 : p.size,
            background: p.color,
            borderRadius: p.shape === 0 ? "50%" : "2px",
            transform: p.shape === 2 ? "rotate(45deg)" : undefined,
            opacity: 0.85,
          }}
        />
      ))}
    </motion.div>
  );
}

// ─── LetterReveal ─────────────────────────────────────────────────────────────

function LetterReveal({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24, rotateX: -50 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.45, delay: delay + i * 0.055, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "inline-block", transformOrigin: "bottom center" }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </>
  );
}

// ─── MessageMarquee ───────────────────────────────────────────────────────────

function MessageMarquee({ messages }: { messages: GuestMessage[] }) {
  const withMsg = messages.filter((m) => m.message?.trim());
  if (withMsg.length === 0) return null;
  const doubled = [...withMsg, ...withMsg];
  const dur = Math.max(24, withMsg.length * 9);

  return (
    <div className="relative overflow-hidden">
      <style>{`
        @keyframes marquee-slide { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee-slide ${dur}s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20" style={{ background: "linear-gradient(to right, var(--muted), transparent)" }} />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20" style={{ background: "linear-gradient(to left, var(--muted), transparent)" }} />
      <div className="marquee-track flex" style={{ width: "max-content" }}>
        {doubled.map((m, i) => (
          <div
            key={i}
            className="mx-3 flex-shrink-0 p-5"
            style={{
              width: 272,
              background: "var(--background)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
              borderRadius: 8,
            }}
          >
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold" style={{ fontFamily: "var(--font-playfair)" }}>{m.name}</p>
              <span
                className="shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-wider"
                style={{
                  background: "transparent",
                  color: m.rsvp_status === "attending" ? "var(--primary)" : "var(--muted-foreground)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {m.rsvp_status === "attending" ? "Hadir" : m.rsvp_status === "not_attending" ? "Tidak Hadir" : "—"}
              </span>
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-playfair)", fontStyle: "italic" }}>
              &ldquo;{m.message}&rdquo;
            </p>
          </div>
        ))}
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
