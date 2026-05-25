import { supabase } from "./client";

export type RsvpPayload = {
  invitation_id: string;
  name: string;
  phone?: string;
  rsvp_status: "attending" | "not_attending" | "pending";
  message?: string;
  guest_count?: number;
};

const RATE_LIMIT_KEY = "rsvp_submitted";
const RATE_LIMIT_MS  = 24 * 60 * 60 * 1000;

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

// Error codes returned by the submit-rsvp Edge Function
const KNOWN_ERRORS = new Set([
  "RSVP_CLOSED",
  "ALREADY_SUBMITTED",
  "RATE_LIMITED",
  "NOT_FOUND",
  "NOT_PUBLISHED",
  "INVALID_PAYLOAD",
]);

export async function submitRsvp(payload: RsvpPayload): Promise<void> {
  const { data, error } = await supabase.functions.invoke("submit-rsvp", {
    body: {
      invitation_id: payload.invitation_id,
      name:          payload.name,
      phone:         payload.phone,
      rsvp_status:   payload.rsvp_status,
      message:       payload.message,
      guest_count:   payload.guest_count,
    },
  });

  if (error) {
    // FunctionsHttpError carries the response body in error.context
    const errCode = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(KNOWN_ERRORS.has(errCode) ? errCode : "UNKNOWN_ERROR");
  }

  if ((data as { error?: string } | null)?.error) {
    const errCode = (data as { error: string }).error;
    throw new Error(KNOWN_ERRORS.has(errCode) ? errCode : "UNKNOWN_ERROR");
  }

  markRsvpSubmitted(payload.invitation_id);
}
