import { supabase } from "./client";
import type { Database } from "./types";

export type GuestMessage = {
  id: string;
  name: string;
  message: string;
  rsvp_status: string;
  created_at: string;
};

export async function getPublicMessages(
  invitationId: string
): Promise<GuestMessage[]> {
  const { data } = await supabase
    .from("guests")
    .select("id, name, message, rsvp_status, created_at")
    .eq("invitation_id", invitationId)
    .eq("is_message_public", true)
    .not("message", "is", null)
    .neq("message", "")
    .order("created_at", { ascending: false });
  return (data as GuestMessage[]) ?? [];
}

export type PublicInvitation =
  Database["public"]["Tables"]["invitations"]["Row"] & {
    template_slug?: string;
  };

export async function getInvitationBySlug(
  slug: string,
  { preview = false }: { preview?: boolean } = {}
): Promise<PublicInvitation | null> {
  let query = supabase
    .from("invitations")
    .select("*, templates(slug)")
    .eq("slug", slug);

  // Preview mode skips is_published filter; RLS ensures only owners see their drafts
  if (!preview) {
    query = query.eq("is_published", true);
  }

  const { data, error } = await query.single();
  if (error) return null;

  const { templates, ...rest } = data as typeof data & {
    templates: { slug: string } | null;
  };
  return { ...rest, template_slug: templates?.slug ?? "rustic-gold" };
}
