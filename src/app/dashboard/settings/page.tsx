"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, KeyRound, Bell, Trash2, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { getUserInvitations } from "@/lib/supabase/invitations";
import { deleteInvitation } from "@/lib/supabase/invitation-crud";

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: danger ? "#fef2f2" : "var(--background)",
        border: `1px solid ${danger ? "#fecaca" : "var(--border)"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {children}
    </div>
  );
}

// ── SettingsPage ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  // Password reset
  const [pwSending,  setPwSending]  = useState(false);
  const [pwSent,     setPwSent]     = useState(false);
  const [pwError,    setPwError]    = useState("");

  // Delete account
  const [deleteStep,   setDeleteStep]   = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteError,  setDeleteError]  = useState("");

  async function handleResetPassword() {
    if (!user?.email) return;
    setPwSending(true);
    setPwError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      setPwSent(true);
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Gagal mengirim email.");
    } finally {
      setPwSending(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteStep("deleting");
    setDeleteError("");
    try {
      const stats = await getUserInvitations();
      for (const s of stats) {
        await deleteInvitation(s.invitation_id);
      }
      // Delete profile (best-effort — RLS may restrict)
      if (user?.id) {
        await supabase.from("profiles").delete().eq("id", user.id);
      }
      await signOut();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Gagal menghapus akun.");
      setDeleteStep("confirm");
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col" style={{ background: "var(--muted)" }}>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl px-4 py-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">

              {/* Account info */}
              <Card>
                <p className="mb-1 text-xs font-medium" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                  Email akun
                </p>
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>
                  {user?.email ?? "—"}
                </p>
              </Card>

              {/* Ganti Password */}
              <Card>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--muted)" }}
                  >
                    <KeyRound className="h-4 w-4" style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Ganti Password</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      Link reset password akan dikirim ke email Anda.
                    </p>

                    <AnimatePresence mode="wait">
                      {pwSent ? (
                        <motion.div
                          key="sent"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
                          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                        >
                          <Check className="h-4 w-4 flex-shrink-0" style={{ color: "#16a34a" }} />
                          <p className="text-xs font-medium" style={{ color: "#16a34a", fontFamily: "var(--font-inter)" }}>
                            Email terkirim — cek inbox Anda.
                          </p>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={handleResetPassword}
                          disabled={pwSending}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60"
                          style={{
                            background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
                            color: "#fff",
                            fontFamily: "var(--font-inter)",
                            boxShadow: "0 2px 8px rgba(176,141,87,0.22)",
                          }}
                        >
                          {pwSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                          Kirim Link Reset
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {pwError && (
                      <p className="mt-2 text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                        {pwError}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Notifikasi RSVP */}
              <Card>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "var(--muted)" }}
                  >
                    <Bell className="h-4 w-4" style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-inter)" }}>Notifikasi RSVP</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontFamily: "var(--font-inter)" }}
                      >
                        Aktif
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      Email otomatis ke <strong>{user?.email}</strong> setiap tamu konfirmasi RSVP.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Hapus Akun */}
              <Card danger>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "#fee2e2" }}
                  >
                    <AlertTriangle className="h-4 w-4" style={{ color: "#dc2626" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                      Hapus Akun
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "#b91c1c", fontFamily: "var(--font-inter)" }}>
                      Semua undangan dan data tamu akan dihapus secara permanen.
                    </p>

                    {deleteError && (
                      <p className="mt-2 text-xs" style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}>
                        {deleteError}
                      </p>
                    )}

                    <AnimatePresence mode="wait">
                      {deleteStep === "idle" && (
                        <motion.button
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setDeleteStep("confirm")}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                          style={{ background: "#dc2626", color: "#fff", fontFamily: "var(--font-inter)" }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus Akun Saya
                        </motion.button>
                      )}

                      {deleteStep === "confirm" && (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-4"
                        >
                          <p className="mb-3 text-sm font-medium" style={{ color: "#7f1d1d", fontFamily: "var(--font-inter)" }}>
                            Ini tidak bisa dibatalkan. Yakin ingin menghapus akun?
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <motion.button
                              onClick={handleDeleteAccount}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium"
                              style={{ background: "#dc2626", color: "#fff", fontFamily: "var(--font-inter)" }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Ya, Hapus Seterusnya
                            </motion.button>
                            <motion.button
                              onClick={() => { setDeleteStep("idle"); setDeleteError(""); }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="rounded-xl px-4 py-2.5 text-sm font-medium"
                              style={{
                                background: "var(--background)",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                fontFamily: "var(--font-inter)",
                              }}
                            >
                              Batal
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {deleteStep === "deleting" && (
                        <motion.div
                          key="deleting"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 flex items-center gap-2"
                        >
                          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#dc2626" }} />
                          <p className="text-sm" style={{ color: "#b91c1c", fontFamily: "var(--font-inter)" }}>
                            Menghapus data...
          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Card>

          </motion.div>
        </div>
      </main>
    </div>
  );
}
