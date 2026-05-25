import { supabase } from "./client";

export type RsvpPayload = {
  invitation_id: string;
  name: string;
  phone?: string;
  rsvp_status: "attending" | "not_attending" | "pending";
  message?: string;
  guest_count?: number;
};

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
    const errCode = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(KNOWN_ERRORS.has(errCode) ? errCode : "UNKNOWN_ERROR");
  }

  if ((data as { error?: string } | null)?.error) {
    const errCode = (data as { error: string }).error;
    throw new Error(KNOWN_ERRORS.has(errCode) ? errCode : "UNKNOWN_ERROR");
  }
}
