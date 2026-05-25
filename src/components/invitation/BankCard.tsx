"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, QrCode } from "lucide-react";

export function BankCard({ bank, accountName, accountNumber, qrisUrl, isLast }: {
  bank: string; accountName: string; accountNumber: string; qrisUrl?: string; isLast?: boolean;
}) {
  const [copied,   setCopied]   = useState(false);
  const [showQris, setShowQris] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = accountNumber;
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
      <div className="flex items-center gap-4 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.25em]"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
            {bank}
          </p>
          <p className="mt-1 text-lg font-bold tracking-[0.1em]"
            style={{ fontFamily: "var(--font-inter)" }}>
            {accountNumber}
          </p>
          <p className="mt-0.5 text-xs"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
            {accountName}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {qrisUrl && (
            <motion.button
              onClick={() => setShowQris(!showQris)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex h-8 w-8 items-center justify-center"
              style={{
                background:   showQris ? "var(--primary)" : "transparent",
                border:       `1px solid ${showQris ? "var(--primary)" : "var(--border)"}`,
                borderRadius: 6,
                color:        showQris ? "#fff" : "var(--muted-foreground)",
              }}
              aria-label="Lihat QRIS"
            >
              <QrCode className="h-3.5 w-3.5" />
            </motion.button>
          )}
          <motion.button
            onClick={handleCopy}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex h-8 w-8 items-center justify-center"
            style={{
              background:   "transparent",
              border:       `1px solid ${copied ? "#16a34a" : "var(--border)"}`,
              borderRadius: 6,
              color:        copied ? "#16a34a" : "var(--muted-foreground)",
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
          <p className="mt-2 text-center text-[9px] uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
            Scan QRIS
          </p>
        </div>
      )}
    </div>
  );
}
