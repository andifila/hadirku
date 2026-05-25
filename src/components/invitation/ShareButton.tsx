"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Check } from "lucide-react";
import type { PublicInvitation } from "@/lib/supabase/public-invitation";

export function ShareButton({ invite }: { invite: PublicInvitation }) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    const url   = typeof window !== "undefined" ? window.location.href : "";
    const title = `Undangan pernikahan ${invite.bride_name} & ${invite.groom_name}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* user dismissed */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* blocked */ }
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <motion.button
      onClick={handleShare}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex items-center gap-2 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
      style={{
        border:      `1px solid ${state === "copied" ? "var(--primary)" : "var(--border)"}`,
        fontFamily:  "var(--font-inter)",
        color:       state === "copied" ? "var(--primary)" : "var(--muted-foreground)",
        transition:  "color 0.2s, border-color 0.2s",
      }}
    >
      {state === "copied"
        ? <><Check className="h-3.5 w-3.5" /> Link Tersalin</>
        : <><Share2 className="h-3.5 w-3.5" /> Bagikan Undangan</>
      }
    </motion.button>
  );
}
