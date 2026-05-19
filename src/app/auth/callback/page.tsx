"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.push("/login");
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          router.push("/login?error=auth_failed");
        } else {
          router.push("/dashboard");
        }
      });
  }, [router, searchParams]);

  return null;
}

export default function CallbackPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: "var(--primary)",
            borderTopColor: "transparent",
          }}
        />
        <p
          className="text-sm"
          style={{
            color: "var(--muted-foreground)",
            fontFamily: "var(--font-inter)",
          }}
        >
          Sedang masuk&hellip;
        </p>
      </motion.div>

      {/* useSearchParams must be inside Suspense */}
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
