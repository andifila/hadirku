"use client";

import { motion } from "framer-motion";

const CONFETTI_COLORS = ["#b08d57", "#c5a46d", "#4a7c59", "#7a9e87", "#e8c98a", "#f8f4ee", "#d4c99a", "#a8c4b0"];

export function ConfettiBurst({ onComplete }: { onComplete: () => void }) {
  const particles = Array.from({ length: 64 }, (_, i) => {
    const angle = (i / 64) * 360 + (Math.random() - 0.5) * 18;
    const dist  = 90 + Math.random() * 220;
    const rad   = (angle * Math.PI) / 180;
    return {
      id:       i,
      tx:       Math.cos(rad) * dist,
      ty:       Math.sin(rad) * dist - 60,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size:     5 + (i % 5) * 3,
      rotation: Math.random() * 720 - 360,
      shape:    i % 3,
      delay:    Math.random() * 0.12,
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
            position:     "absolute",
            width:        p.size,
            height:       p.shape === 1 ? p.size * 0.45 : p.size,
            background:   p.color,
            borderRadius: p.shape === 0 ? "50%" : "2px",
            opacity:      0.85,
          }}
        />
      ))}
    </motion.div>
  );
}
