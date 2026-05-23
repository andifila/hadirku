import { supabase } from "./client";
import type { Database } from "./types";

export type InvitationStat =
  Database["public"]["Views"]["invitation_stats"]["Row"];

export async function getUserInvitations(): Promise<InvitationStat[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("invitation_stats")
    .select("*")
    .eq("user_id", user.id)
    .order("event_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
