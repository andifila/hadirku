import { supabase } from "./client";
import type { Database } from "./types";

export type Guest = Database["public"]["Tables"]["guests"]["Row"];
export type GuestInsert = Pick<
  Database["public"]["Tables"]["guests"]["Insert"],
  "invitation_id" | "name" | "phone"
>;

export async function getInvitationGuests(invitationId: string): Promise<Guest[]> {
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("invitation_id", invitationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addGuest(payload: GuestInsert): Promise<Guest> {
  const { data, error } = await supabase
    .from("guests")
    .insert({
      invitation_id: payload.invitation_id,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeGuest(id: string): Promise<void> {
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkAddGuests(
  invitationId: string,
  rows: Array<{ name: string; phone: string }>
): Promise<number> {
  if (!rows.length) return 0;
  const inserts = rows.map((g) => ({
    invitation_id: invitationId,
    name: g.name.trim(),
    phone: g.phone?.trim() || null,
  }));
  const { data, error } = await supabase.from("guests").insert(inserts).select("id");
  if (error) throw error;
  return data?.length ?? inserts.length;
}

export function toWaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}

export async function updateGuest(
  id: string,
  updates: { name?: string; phone?: string | null }
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.phone !== undefined) payload.phone = updates.phone?.trim() || null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("guests") as any).update(payload).eq("id", id);
  if (error) throw error;
}

export function buildInviteUrl(slug: string, guestName: string): string {
  if (typeof window === "undefined") return "";
  const base =
    process.env.NODE_ENV === "production" ? "/hadirku" : "";
  const encoded = encodeURIComponent(guestName);
  return `${window.location.origin}${base}/invite/?s=${slug}&to=${encoded}`;
}
