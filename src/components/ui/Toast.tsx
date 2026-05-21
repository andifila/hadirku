"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";

type ToastProps = {
  message: string;
  visible: boolean;
  onClose: () => void;
  type?: "success" | "error";
};

export function Toast({ message, visible, onClose, type = "success" }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  const colors = type === "success"
    ? { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", icon: "#16a34a" }
    : { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", icon: "#dc2626" };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3 shadow-lg"
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            minWidth: 240,
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          {type === "success"
            ? <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: colors.icon }} />
            : <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: colors.icon }} />
          }
          <p className="flex-1 text-sm font-medium" style={{ color: colors.text, fontFamily: "var(--font-inter)" }}>
            {message}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 transition-opacity hover:opacity-60"
            aria-label="Tutup"
          >
            <X className="h-3.5 w-3.5" style={{ color: colors.text }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
