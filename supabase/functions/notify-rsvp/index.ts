import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STATUS: Record<string, string> = {
  attending:     "Hadir",
  not_attending: "Tidak Hadir",
  pending:       "Belum Konfirmasi",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify webhook secret to prevent unauthorized calls
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const payload = await req.json();
    const record = payload.record as {
      id: string;
      invitation_id: string;
      name: string;
      rsvp_status: string;
      message: string | null;
      guest_count: number | null;
      phone: string | null;
    };

    if (!record?.invitation_id || !record?.name) {
      return new Response("Invalid payload", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get invitation details + owner
    const { data: inv, error: invErr } = await supabase
      .from("invitations")
      .select("bride_name, groom_name, slug, user_id, event_date, venue_name")
      .eq("id", record.invitation_id)
      .single();

    if (invErr || !inv) {
      return new Response("invitation not found", { status: 404 });
    }

    // Get owner email from auth
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(inv.user_id);
    if (userErr || !userData?.user?.email) {
      return new Response("owner email not found", { status: 400 });
    }

    const ownerEmail = userData.user.email;
    const rsvpLabel  = STATUS[record.rsvp_status] ?? record.rsvp_status;
    const eventDate  = new Date(inv.event_date).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const safeName    = escapeHtml(record.name);
    const safePhone   = record.phone   ? escapeHtml(record.phone)   : null;
    const safeMessage = record.message ? escapeHtml(record.message) : null;
    const safeBride   = escapeHtml(inv.bride_name);
    const safeGroom   = escapeHtml(inv.groom_name);
    const safeVenue   = escapeHtml(inv.venue_name);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "Undangan Digital <onboarding@resend.dev>",
        to: [ownerEmail],
        subject: `RSVP baru: ${safeName} — ${safeBride} & ${safeGroom}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #faf9f7;">
            <p style="font-size: 13px; color: #888; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 8px;">
              Konfirmasi RSVP
            </p>
            <h1 style="font-size: 22px; color: #2c2622; margin: 0 0 4px;">
              ${safeBride} &amp; ${safeGroom}
            </h1>
            <p style="font-size: 13px; color: #888; margin: 0 0 24px;">${eventDate} · ${safeVenue}</p>

            <div style="background: #fff; border: 1px solid #e8e4de; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #888; width: 40%;">Nama</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #2c2622;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #888; border-top: 1px solid #f0ede8;">Status</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${record.rsvp_status === "attending" ? "#16a34a" : record.rsvp_status === "not_attending" ? "#dc2626" : "#d97706"}; border-top: 1px solid #f0ede8;">${rsvpLabel}</td>
                </tr>
                ${record.guest_count != null ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #888; border-top: 1px solid #f0ede8;">Jumlah</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2622; border-top: 1px solid #f0ede8;">${record.guest_count} orang</td>
                </tr>` : ""}
                ${safePhone ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #888; border-top: 1px solid #f0ede8;">No. HP</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2622; border-top: 1px solid #f0ede8;">${safePhone}</td>
                </tr>` : ""}
                ${safeMessage ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #888; border-top: 1px solid #f0ede8; vertical-align: top;">Ucapan</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #2c2622; border-top: 1px solid #f0ede8; font-style: italic;">&ldquo;${safeMessage}&rdquo;</td>
                </tr>` : ""}
              </table>
            </div>

            <a href="${Deno.env.get("SITE_URL") ?? "https://andifila.github.io/hadirku"}/dashboard/stats"
              style="display: inline-block; background: linear-gradient(135deg, #b08d57, #9a7040); color: #fff;
                     text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-family: sans-serif;">
              Lihat Semua RSVP
            </a>

            <p style="margin-top: 32px; font-size: 11px; color: #bbb; font-family: sans-serif;">
              Email ini dikirim otomatis dari undangan digital Anda.
            </p>
          </div>
        `,
      }),
    });

    const body = await res.json();
    return new Response(JSON.stringify({ ok: res.ok, resend: body }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
