"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { signInWithMagicLink } from "@/lib/supabase/auth";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type FormState = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { user, loading } = useAuth();
  const router = useRouter();

  // redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setFormState("loading");
    setErrorMsg("");

    const { error } = await signInWithMagicLink(email.trim());

    if (error) {
      setErrorMsg(error.message);
      setFormState("error");
    } else {
      setFormState("sent");
    }
  }

  if (loading) return null;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "var(--muted)" }}
    >
      {/* decorative circles */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--primary)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--primary)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* brand */}
        <div className="mb-8 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-2 text-xs uppercase tracking-widest"
            style={{ color: "var(--primary)", fontFamily: "var(--font-inter)" }}
          >
            Wedding Invite
          </motion.p>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Selamat Datang
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm"
            style={{
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Masukkan email Anda — kami akan kirimkan magic link untuk masuk.
          </motion.p>
        </div>

        {/* card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="rounded-2xl p-8 shadow-sm"
          style={{ background: "var(--background)", border: "1px solid var(--border)" }}
        >
          <AnimatePresence mode="wait">
            {formState === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-4 text-center"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "var(--muted)" }}
                >
                  <CheckCircle
                    className="h-8 w-8"
                    style={{ color: "var(--primary)" }}
                  />
                </div>
                <div>
                  <p
                    className="font-semibold"
                    style={{ fontFamily: "var(--font-playfair)", fontSize: "1.1rem" }}
                  >
                    Cek Email Anda
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                  >
                    Kami mengirimkan magic link ke{" "}
                    <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                      {email}
                    </span>
                  </p>
                </div>
                <motion.button
                  onClick={() => setFormState("idle")}
                  whileHover={{ opacity: 0.65 }}
                  whileTap={{ scale: 0.97 }}
                  className="text-sm underline underline-offset-4"
                  style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                >
                  Gunakan email lain
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: "var(--muted-foreground)",
                      fontFamily: "var(--font-inter)",
                    }}
                  >
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "var(--muted-foreground)" }}
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className={cn(
                        "w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all",
                        "placeholder:text-[var(--muted-foreground)]",
                        "focus:ring-2"
                      )}
                      style={{
                        background: "var(--muted)",
                        border: "1px solid var(--border)",
                        fontFamily: "var(--font-inter)",
                        color: "var(--foreground)",
                        // @ts-expect-error css var
                        "--tw-ring-color": "var(--primary)",
                      }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {formState === "error" && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg px-3 py-2 text-sm"
                      style={{
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {errorMsg || "Terjadi kesalahan. Coba lagi."}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={formState === "loading" || !email.trim()}
                  whileHover={formState !== "loading" && !!email.trim() ? { scale: 1.02, boxShadow: "0 4px 18px rgba(176,141,87,0.4)" } : undefined}
                  whileTap={formState !== "loading" && !!email.trim() ? { scale: 0.98 } : undefined}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                  style={{
                    background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
                    color: "var(--primary-foreground)",
                    fontFamily: "var(--font-inter)",
                  }}
                >
                  {formState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Kirim Magic Link
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p
          className="mt-6 text-center text-xs"
          style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
        >
          Tidak perlu password. Cukup email Anda.
        </p>
      </motion.div>
    </main>
  );
}
