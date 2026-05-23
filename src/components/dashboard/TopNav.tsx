"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileText, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserInvitations } from "@/lib/supabase/invitations";

const MotionLink = motion(Link);

export function TopNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

  const load = useCallback(async () => {
    const stats = await getUserInvitations().catch(() => []);
    if (stats.length) setInvitationId(stats[0].invitation_id);
  }, []);

  useEffect(() => { load(); }, [load]);

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      short: "Home",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: FileText,
      label: "Undangan",
      short: "Edit",
      href: invitationId ? `/dashboard/edit?id=${invitationId}` : "/dashboard/new",
      active: pathname === "/dashboard/edit" || pathname === "/dashboard/new",
    },
    {
      icon: Users,
      label: "Tamu",
      short: "Tamu",
      href: "/dashboard/guests",
      active: pathname === "/dashboard/guests",
    },
    {
      icon: BarChart3,
      label: "Statistik",
      short: "Stats",
      href: "/dashboard/stats",
      active: pathname === "/dashboard/stats",
    },
    {
      icon: Settings,
      label: "Pengaturan",
      short: "Akun",
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
  ];

  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 px-3 sm:px-5"
      style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Brand */}
      <Link
        href="/dashboard"
        className="flex-shrink-0 select-none"
        style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}
      >
        <span className="hidden text-lg font-bold sm:inline">WeddingInvite</span>
        <span className="text-base font-bold sm:hidden">WI</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 items-center justify-center gap-0.5">
        {navItems.map((item) => (
          <MotionLink
            key={item.label}
            href={item.href}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-2"
            style={{
              color: item.active ? "var(--primary)" : "var(--muted-foreground)",
              fontFamily: "var(--font-inter)",
            }}
          >
            {item.active && (
              <motion.div
                layoutId="topnav-pill"
                className="absolute inset-0 rounded-xl"
                style={{ background: "var(--muted)" }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex-shrink-0">
              <item.icon className="h-[18px] w-[18px]" />
            </span>
            <span
              className="relative z-10 text-[9px] font-medium sm:hidden"
              style={{ letterSpacing: "0.01em", lineHeight: 1 }}
            >
              {item.short}
            </span>
            <span
              className="relative z-10 hidden text-[11px] font-medium sm:inline"
              style={{ letterSpacing: "0.01em" }}
            >
              {item.label}
            </span>
          </MotionLink>
        ))}
      </nav>

      {/* User avatar + dropdown */}
      <div ref={menuRef} className="relative ml-auto flex-shrink-0">
        <button
          onClick={() => setShowUserMenu((v) => !v)}
          className="flex h-8 w-8 select-none items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
            color: "#fff",
            fontFamily: "var(--font-inter)",
            boxShadow: "0 2px 8px rgba(176,141,87,0.28)",
          }}
          title={user?.email}
        >
          {initial}
        </button>

        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl p-2"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              <div className="px-3 py-2">
                <p
                  className="truncate text-xs font-medium"
                  style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
                >
                  {user?.email}
                </p>
              </div>
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              <button
                onClick={() => { signOut(); setShowUserMenu(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: "#dc2626", fontFamily: "var(--font-inter)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
