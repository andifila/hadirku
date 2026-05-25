import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://andifila.github.io",
  "http://localhost:3000",
  "http://localhost:3001",
];

function corsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };
}

const RATE_LIMIT_PER_MINUTE = 15;
const MAX_NAME_LENGTH    = 200;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_GUEST_COUNT    = 20;

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const CORS   = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), { status: 405, headers: CORS });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const { invitation_id, name, phone, rsvp_status, message, guest_count } = body;

    // Required field presence
    if (!invitation_id || !name?.trim() || !rsvp_status) {
      return new Response(JSON.stringify({ error: "INVALID_PAYLOAD" }), { status: 400, headers: CORS });
    }

    // Enum validation
    if (!["attending", "not_attending", "pending"].includes(rsvp_status)) {
      return new Response(JSON.stringify({ error: "INVALID_PAYLOAD" }), { status: 400, headers: CORS });
    }

    // Length limits
    if (name.trim().length > MAX_NAME_LENGTH) {
      return new Response(JSON.stringify({ error: "INVALID_PAYLOAD" }), { status: 400, headers: CORS });
    }
    if (message && String(message).length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ error: "INVALID_PAYLOAD" }), { status: 400, headers: CORS });
    }

    // guest_count range (only relevant when attending)
    if (rsvp_status === "attending" && guest_count !== undefined && guest_count !== null) {
      const count = Number(guest_count);
      if (!Number.isInteger(count) || count < 1 || count > MAX_GUEST_COUNT) {
        return new Response(JSON.stringify({ error: "INVALID_PAYLOAD" }), { status: 400, headers: CORS });
      }
    }

    // Verify invitation exists and is published
    const { data: inv, error: invErr } = await supabase
      .from("invitations")
      .select("id, is_published, rsvp_closes_at")
      .eq("id", invitation_id)
      .single();

    if (invErr || !inv) {
      return new Response(JSON.stringify({ error: "NOT_FOUND" }), { status: 404, headers: CORS });
    }
    if (!inv.is_published) {
      return new Response(JSON.stringify({ error: "NOT_PUBLISHED" }), { status: 403, headers: CORS });
    }
    if (inv.rsvp_closes_at && new Date(inv.rsvp_closes_at) < new Date()) {
      return new Response(JSON.stringify({ error: "RSVP_CLOSED" }), { status: 403, headers: CORS });
    }

    // Rate limit: count insertions for this invitation in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("invitation_id", invitation_id)
      .gte("created_at", oneMinuteAgo);

    if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: "RATE_LIMITED" }),
        { status: 429, headers: { ...CORS, "Retry-After": "60" } },
      );
    }

    const trimmedName  = name.trim();
    const trimmedPhone = phone?.trim() || null;

    // Duplicate check: phone first, then name
    let existing: { id: string } | null = null;

    if (trimmedPhone) {
      const { data } = await supabase
        .from("guests")
        .select("id")
        .eq("invitation_id", invitation_id)
        .eq("phone", trimmedPhone)
        .maybeSingle();
      existing = data;
    }
    if (!existing) {
      const { data } = await supabase
        .from("guests")
        .select("id")
        .eq("invitation_id", invitation_id)
        .ilike("name", trimmedName)
        .maybeSingle();
      existing = data;
    }

    if (existing) {
      return new Response(JSON.stringify({ error: "ALREADY_SUBMITTED" }), { status: 409, headers: CORS });
    }

    // Insert
    const { error: insertErr } = await supabase.from("guests").insert({
      invitation_id,
      name:        trimmedName,
      phone:       trimmedPhone,
      rsvp_status,
      message:     message?.trim() || null,
      guest_count: rsvp_status === "attending" ? (Number(guest_count) || 1) : null,
    });

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "INSERT_FAILED" }), { status: 500, headers: CORS });
    }

    // Fire-and-forget: notify owner via notify-rsvp
    const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-rsvp`;
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    fetch(notifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
      },
      body: JSON.stringify({
        record: {
          invitation_id,
          name:        trimmedName,
          phone:       trimmedPhone,
          rsvp_status,
          message:     message?.trim() || null,
          guest_count: rsvp_status === "attending" ? (Number(guest_count) || 1) : null,
        },
      }),
    }).catch((e) => console.error("notify-rsvp error:", e));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR" }), { status: 500, headers: CORS });
  }
});
