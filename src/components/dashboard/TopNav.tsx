"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, Users, BarChart3, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserInvitations } from "@/lib/supabase/invitations";

const MotionLink = motion(Link);

export function TopNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [invitationId, setInvitationId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const stats = await getUserInvitations().catch(() => []);
    if (stats.length) setInvitationId(stats[0].invitation_id);
  }, []);

  useEffect(() => { load(); }, [load]);

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: FileText,
      label: "Undangan",
      href: invitationId ? `/dashboard/edit?id=${invitationId}` : "/dashboard/new",
      active: pathname === "/dashboard/edit" || pathname === "/dashboard/new",
    },
    {
      icon: Users,
      label: "Tamu",
      href: "/dashboard/guests",
      active: pathname === "/dashboard/guests",
    },
    {
      icon: BarChart3,
      label: "Statistik",
      href: "/dashboard/stats",
      active: pathname === "/dashboard/stats",
    },
    {
      icon: Settings,
      label: "Pengaturan",
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
            className="relative flex items-center gap-1.5 rounded-xl px-2.5 py-2"
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
              className="relative z-10 hidden text-[11px] font-medium sm:inline"
              style={{ letterSpacing: "0.01em" }}
            >
              {item.label}
            </span>
          </MotionLink>
        ))}
      </nav>

      {/* User avatar */}
      <div
        className="ml-auto flex h-8 w-8 flex-shrink-0 select-none items-center justify-center rounded-full text-xs font-bold"
        style={{
          background: "linear-gradient(135deg, #b08d57 0%, #9a7040 100%)",
          color: "#fff",
          fontFamily: "var(--font-inter)",
          boxShadow: "0 2px 8px rgba(176,141,87,0.28)",
        }}
        title={user?.email}
      >
        {initial}
      </div>
    </header>
  );
}
