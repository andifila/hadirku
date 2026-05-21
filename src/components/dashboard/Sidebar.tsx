"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, Users, BarChart3,
  Settings, LogOut, X,
} from "lucide-react";

const MotionLink = motion(Link);

export function Sidebar({
  userEmail,
  onSignOut,
  onClose,
  invitationId,
}: {
  userEmail: string;
  onSignOut: () => void;
  onClose?: () => void;
  invitationId?: string | null;
}) {
  const pathname = usePathname();

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
      active: pathname === "/dashboard/edit",
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

  return (
    <aside
      className="flex h-full w-60 flex-col"
      style={{ background: "var(--background)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <span
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair)", color: "var(--primary)" }}
        >
          WeddingInvite
        </span>
        {onClose && (
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.12, rotate: 90 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="rounded-lg p-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <MotionLink
            key={item.label}
            href={item.href}
            onClick={onClose}
            animate={{ backgroundColor: item.active ? "#f3f0eb" : "rgba(0,0,0,0)" }}
            whileHover={{ x: 2, backgroundColor: "#f3f0eb" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
            style={{
              color: item.active ? "var(--primary)" : "var(--muted-foreground)",
              fontFamily: "var(--font-inter)",
            }}
          >
            <span className="flex-shrink-0">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{item.label}</span>
            {item.active && (
              <motion.span
                layoutId="nav-active-dot"
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--primary)" }}
              />
            )}
          </MotionLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3">
        <div
          className="flex items-center gap-2.5 rounded-xl p-3"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-inter)" }}
          >
            {userEmail ? userEmail[0].toUpperCase() : "U"}
          </div>
          <p
            className="min-w-0 flex-1 truncate text-xs"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-inter)" }}
          >
            {userEmail}
          </p>
          <motion.button
            onClick={onSignOut}
            title="Keluar"
            whileHover={{ scale: 1.14, rotate: 6 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="flex-shrink-0 rounded-lg p-1.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
