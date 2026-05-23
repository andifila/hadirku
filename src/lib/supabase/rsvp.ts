import { supabase } from "./client";
import type { RsvpStatus } from "./types";

export type RsvpPayload = {
  invitation_id: string;
  name: string;
  phone?: string;
  rsvp_status: RsvpStatus;
  message?: string;
  guest_count?: number;
  rsvp_closes_at?: string | null;
};

const RATE_LIMIT_KEY = "rsvp_submitted";
const RATE_LIMIT_MS  = 24 * 60 * 60 * 1000; // 24 hours

export function checkRsvpRateLimit(invitationId: string): boolean {
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_KEY}:${invitationId}`);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Date.now() - ts < RATE_LIMIT_MS;
  } catch {
    return false;
  }
}

export function markRsvpSubmitted(invitationId: string): void {
  try {
    localStorage.setItem(`${RATE_LIMIT_KEY}:${invitationId}`, String(Date.now()));
  } catch {}
}

export async function submitRsvp(payload: RsvpPayload): Promise<void> {
  if (payload.rsvp_closes_at && new Date(payload.rsvp_closes_at) < new Date()) {
    throw new Error("RSVP_CLOSED");
  }

  const trimmedName  = payload.name.trim();
  const trimmedPhone = payload.phone?.trim() || null;

  // Check by phone first (more accurate), then fall back to name match
  let existing: { id: string } | null = null;

  if (trimmedPhone) {
    const { data } = await supabase
      .from("guests")
      .select("id")
      .eq("invitation_id", payload.invitation_id)
      .eq("phone", trimmedPhone)
      .maybeSingle();
    existing = data;
  }

  if (!existing) {
    const { data } = await supabase
      .from("guests")
      .select("id")
      .eq("invitation_id", payload.invitation_id)
      .ilike("name", trimmedName)
      .maybeSingle();
    existing = data;
  }

  if (existing) throw new Error("ALREADY_SUBMITTED");

  const { error } = await supabase.from("guests").insert({
    invitation_id: payload.invitation_id,
    name:          trimmedName,
    phone:         trimmedPhone,
    rsvp_status:   payload.rsvp_status,
    message:       payload.message?.trim() || null,
    guest_count:   payload.rsvp_status === "attending" ? (payload.guest_count ?? 1) : null,
  });

  if (error) throw error;

  markRsvpSubmitted(payload.invitation_id);
}
