import { supabase } from "./client";
import { PROD_URL } from "@/lib/constants";

function getRedirectUrl() {
  const base = process.env.NODE_ENV === "production" ? PROD_URL : "http://localhost:3000";
  return `${base}/auth/callback/`;
}

export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getRedirectUrl(),
    },
  });
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
