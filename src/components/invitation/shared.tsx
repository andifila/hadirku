"use client";

import { motion } from "framer-motion";

export function RevealSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ children, ornament = "line" }: { children: React.ReactNode; ornament?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center gap-2"
      >
        {ornament === "leaf"    && <span style={{ color: "var(--primary)", fontSize: 15 }}>🌿</span>}
        {ornament === "crown"   && <span style={{ color: "var(--primary)", fontSize: 14 }}>♛</span>}
        {ornament === "bloom"   && <span style={{ color: "var(--primary)", fontSize: 15 }}>✿</span>}
        {ornament === "diamond" && <div className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--primary)" }} />}
        {(ornament === "line" || !["leaf","crown","bloom","diamond"].includes(ornament)) && (
          <div className="h-px w-8" style={{ background: "var(--primary)" }} />
        )}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="font-bold"
        style={{
          fontFamily: "var(--font-playfair)",
          color: "var(--foreground)",
          fontSize: "clamp(1.875rem, 7vw, 2.25rem)",
        }}
      >
        {children}
      </motion.h2>
    </div>
  );
}

export function LetterReveal({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "inline-block" }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </>
  );
}
