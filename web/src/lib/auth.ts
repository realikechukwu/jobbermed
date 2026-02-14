import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase-client";

export async function getCurrentUser(
  supabase: SupabaseClient = getSupabaseClient(),
): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}
