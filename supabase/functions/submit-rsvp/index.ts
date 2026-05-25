import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Max guest insertions per invitation per minute (anti-spam)
const RATE_LIMIT_PER_MINUTE = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
      { status: 405, headers: CORS_HEADERS }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { invitation_id, name, phone, rsvp_status, message, guest_count } = body;

    if (!invitation_id || !name?.trim() || !rsvp_status) {
      return new Response(
        JSON.stringify({ error: "INVALID_PAYLOAD" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const validStatuses = ["attending", "not_attending", "pending"];
    if (!validStatuses.includes(rsvp_status)) {
      return new Response(
        JSON.stringify({ error: "INVALID_PAYLOAD" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Verify invitation exists and is published
    const { data: inv, error: invErr } = await supabase
      .from("invitations")
      .select("id, is_published, rsvp_closes_at")
      .eq("id", invitation_id)
      .single();

    if (invErr || !inv) {
      return new Response(
        JSON.stringify({ error: "NOT_FOUND" }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    if (!inv.is_published) {
      return new Response(
        JSON.stringify({ error: "NOT_PUBLISHED" }),
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Server-side RSVP deadline validation
    if (inv.rsvp_closes_at && new Date(inv.rsvp_closes_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "RSVP_CLOSED" }),
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Rate limit: count guest insertions for this invitation in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("invitation_id", invitation_id)
      .gte("created_at", oneMinuteAgo);

    if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: "RATE_LIMITED" }),
        { status: 429, headers: { ...CORS_HEADERS, "Retry-After": "60" } }
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
      return new Response(
        JSON.stringify({ error: "ALREADY_SUBMITTED" }),
        { status: 409, headers: CORS_HEADERS }
      );
    }

    // Insert guest
    const { error: insertErr } = await supabase
      .from("guests")
      .insert({
        invitation_id,
        name:        trimmedName,
        phone:       trimmedPhone,
        rsvp_status,
        message:     message?.trim() || null,
        guest_count: rsvp_status === "attending" ? (guest_count ?? 1) : null,
      });

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(
        JSON.stringify({ error: "INSERT_FAILED" }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR" }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
