"use client";

import { motion } from "framer-motion";
import type { GuestMessage } from "@/lib/supabase/public-invitation";

export function MessageWall({ messages }: { messages: GuestMessage[] }) {
  const withMsg = messages.filter((m) => m.message?.trim());
  if (withMsg.length === 0) return null;

  return (
    <div className="px-6">
      <div className="mx-auto flex max-w-sm flex-col gap-3">
        {withMsg.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.07, 0.35), ease: [0.22, 1, 0.36, 1] }}
            className="p-5"
            style={{
              background:   "var(--background)",
              boxShadow:    "0 2px 12px rgba(0,0,0,0.04)",
              borderRadius: 8,
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold"
                style={{ fontFamily: "var(--font-playfair)" }}>
                {m.name}
              </p>
              <span
                className="shrink-0 text-[9px] uppercase tracking-wider"
                style={{
                  color: m.rsvp_status === "attending" ? "var(--primary)" : "var(--muted-foreground)",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {m.rsvp_status === "attending" ? "Hadir" : m.rsvp_status === "not_attending" ? "Tidak Hadir" : "—"}
              </span>
            </div>
            <p className="text-xs leading-relaxed"
              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-playfair)", fontStyle: "italic" }}>
              &ldquo;{m.message}&rdquo;
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
