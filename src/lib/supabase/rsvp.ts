import { supabase } from "./client";
import type { RsvpStatus } from "./types";

export type RsvpPayload = {
  invitation_id: string;
  name: string;
  phone?: string;
  rsvp_status: RsvpStatus;
  message?: string;
  guest_count?: number;
};

export async function submitRsvp(payload: RsvpPayload): Promise<void> {
  const trimmedName = payload.name.trim();

  const { data: existing } = await supabase
    .from("guests")
    .select("id")
    .eq("invitation_id", payload.invitation_id)
    .ilike("name", trimmedName)
    .maybeSingle();

  if (existing) throw new Error("ALREADY_SUBMITTED");

  const { error } = await supabase.from("guests").insert({
    invitation_id: payload.invitation_id,
    name: trimmedName,
    phone: payload.phone?.trim() || null,
    rsvp_status: payload.rsvp_status,
    message: payload.message?.trim() || null,
    guest_count: payload.rsvp_status === "attending" ? (payload.guest_count ?? 1) : null,
  });

  if (error) throw error;
}
