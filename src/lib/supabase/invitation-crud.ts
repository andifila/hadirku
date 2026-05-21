import { supabase } from "./client";
import type { Database } from "./types";

export type Template = Database["public"]["Tables"]["templates"]["Row"];
export type InvitationInsert =
  Database["public"]["Tables"]["invitations"]["Insert"];
export type InvitationUpdate =
  Database["public"]["Tables"]["invitations"]["Update"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];

export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function createInvitation(
  payload: Omit<InvitationInsert, "user_id">
): Promise<Invitation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("invitations")
    .insert({ ...payload, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInvitation(
  id: string,
  payload: InvitationUpdate
): Promise<void> {
  const { error } = await supabase
    .from("invitations")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
}

export async function getInvitationById(id: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function deleteInvitation(id: string): Promise<void> {
  await supabase.from("guests").delete().eq("invitation_id", id);
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  if (error) throw error;
}

export function generateSlug(bride: string, groom: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${clean(bride)}-${clean(groom)}-${suffix}`;
}
