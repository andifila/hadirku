"use client";

import { motion } from "framer-motion";

export function HeroOrnament({ color, templateSlug }: { color: string; templateSlug: string }) {
  switch (templateSlug) {
    case "garden-bloom":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 220, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            width="680" height="680" viewBox="0 0 200 200" fill="none"
            style={{ opacity: 0.055, originX: "50%", originY: "50%" }}
          >
            {[0,45,90,135,180,225,270,315].map((deg) => (
              <ellipse key={deg}
                cx={100 + Math.cos((deg * Math.PI) / 180) * 70}
                cy={100 + Math.sin((deg * Math.PI) / 180) * 70}
                rx="9" ry="24"
                transform={`rotate(${deg + 90}, ${100 + Math.cos((deg * Math.PI) / 180) * 70}, ${100 + Math.sin((deg * Math.PI) / 180) * 70})`}
                stroke={color} strokeWidth="0.6" fill="none"
              />
            ))}
            <circle cx="100" cy="100" r="88" stroke={color} strokeWidth="0.4" />
            <circle cx="100" cy="100" r="42" stroke={color} strokeWidth="0.3" />
          </motion.svg>
        </div>
      );
    case "modern-minimal":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-10 right-10 top-10 h-px" style={{ background: color, opacity: 0.07 }} />
          <div className="absolute left-10 right-10 bottom-10 h-px" style={{ background: color, opacity: 0.07 }} />
          <div className="absolute top-10 bottom-10 left-10 w-px" style={{ background: color, opacity: 0.07 }} />
          <div className="absolute top-10 bottom-10 right-10 w-px" style={{ background: color, opacity: 0.07 }} />
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: color, opacity: 0.04 }} />
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2" style={{ background: color, opacity: 0.04 }} />
        </div>
      );
    case "royal-elegance":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 130, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            width="720" height="720" viewBox="0 0 200 200" fill="none"
            style={{ opacity: 0.06, originX: "50%", originY: "50%" }}
          >
            {[0,15,30,45,60,75,90,105,120,135,150,165].map((deg) => (
              <line key={deg}
                x1="100" y1="100"
                x2={100 + Math.cos((deg * Math.PI) / 180) * 86}
                y2={100 + Math.sin((deg * Math.PI) / 180) * 86}
                stroke={color} strokeWidth="0.35"
              />
            ))}
            <circle cx="100" cy="100" r="86" stroke={color} strokeWidth="0.5" />
            <circle cx="100" cy="100" r="58" stroke={color} strokeWidth="0.45" />
            <circle cx="100" cy="100" r="30" stroke={color} strokeWidth="0.4" />
          </motion.svg>
        </div>
      );
    case "floral-dream":
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.svg
            animate={{ rotate: -360 }}
            transition={{ duration: 190, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            width="660" height="660" viewBox="0 0 200 200" fill="none"
            style={{ opacity: 0.055, originX: "50%", originY: "50%" }}
          >
            {[0,60,120,180,240,300].map((deg) => (
              <ellipse key={deg}
                cx={100 + Math.cos((deg * Math.PI) / 180) * 56}
                cy={100 + Math.sin((deg * Math.PI) / 180) * 56}
                rx="13" ry="40"
                transform={`rotate(${deg + 90}, ${100 + Math.cos((deg * Math.PI) / 180) * 56}, ${100 + Math.sin((deg * Math.PI) / 180) * 56})`}
                stroke={color} strokeWidth="0.55" fill="none"
              />
            ))}
            <circle cx="100" cy="100" r="86" stroke={color} strokeWidth="0.4" />
          </motion.svg>
        </div>
      );
    default: // rustic-gold
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            width="720" height="720" viewBox="0 0 200 200" fill="none"
            style={{ opacity: 0.045, originX: "50%", originY: "50%" }}
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
}
