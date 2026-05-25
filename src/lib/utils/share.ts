import { APP_BASE } from "@/lib/constants";

export function getShareLink(slug: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${APP_BASE}/invite/?s=${slug}`;
}

export function getInviteUrl(slug: string, guestName: string): string {
  return `${getShareLink(slug)}&to=${encodeURIComponent(guestName)}`;
}
