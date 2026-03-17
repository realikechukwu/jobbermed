import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase-client";

function resolveRouterBase(): string {
  return import.meta.env.BASE_URL === "/"
    ? ""
    : import.meta.env.BASE_URL.replace(/\/$/, "");
}

export function resolveNextPath(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export function buildAuthRedirectUrl(
  authPath: "/signin" | "/signup",
  nextPath: string,
): string {
  const safeNextPath = resolveNextPath(nextPath);
  const redirectPath = `${resolveRouterBase()}${authPath}`;

  if (typeof window === "undefined" || !window.location?.origin) {
    return `${authPath}?next=${encodeURIComponent(safeNextPath)}`;
  }

  const redirectUrl = new URL(redirectPath, window.location.origin);
  redirectUrl.searchParams.set("next", safeNextPath);
  return redirectUrl.toString();
}

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
