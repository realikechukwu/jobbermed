import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailFrequency = "daily" | "weekly";

export type EmailPreferences = {
  personalizeEnabled: boolean;
  frequency: EmailFrequency;
  categories: string[];
  locations: string[];
};

export type LoadPreferencesResult =
  | { status: "ok"; preferences: EmailPreferences }
  | { status: "unavailable"; reason: string }
  | { status: "error"; error: string };

export type SavePreferencesResult =
  | { status: "ok"; preferences: EmailPreferences }
  | { status: "unavailable"; reason: string }
  | { status: "error"; error: string };

type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
};

const MISSING_RELATION_CODES = new Set(["PGRST205", "42P01"]);

export const defaultEmailPreferences: EmailPreferences = {
  personalizeEnabled: false,
  frequency: "weekly",
  categories: [],
  locations: [],
};

class PreferencesUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreferencesUnavailableError";
  }
}

function normalizeList(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  values.forEach((value) => {
    const cleaned = value.trim();
    if (!cleaned) {
      return;
    }
    const key = cleaned.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    normalized.push(cleaned);
  });

  return normalized;
}

function asErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as PostgrestLikeError;
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

function isMissingRelationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as PostgrestLikeError;
  const code = (candidate.code ?? "").toUpperCase();
  if (MISSING_RELATION_CODES.has(code)) {
    return true;
  }

  const message = `${candidate.message ?? ""} ${candidate.details ?? ""}`.toLowerCase();
  if (!message) {
    return false;
  }

  return (
    message.includes("could not find the table") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

function sanitizeFrequency(value: unknown): EmailFrequency {
  if (value === "daily") {
    return value;
  }
  return "weekly";
}

async function readStringSetTable(
  supabase: SupabaseClient,
  tableName: string,
  columnName: string,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase.from(tableName).select(columnName).eq("user_id", userId);

  if (error) {
    if (isMissingRelationError(error)) {
      throw new PreferencesUnavailableError(
        `Personalisation tables are not ready yet (${tableName}).`,
      );
    }
    throw error;
  }

  const rows = Array.isArray(data) ? (data as unknown as Array<Record<string, unknown>>) : [];
  const values = rows
    .map((row) => row[columnName])
    .filter((value): value is string => typeof value === "string");
  return normalizeList(values);
}

async function replaceStringSetTable(
  supabase: SupabaseClient,
  tableName: string,
  columnName: string,
  userId: string,
  values: string[],
): Promise<void> {
  const { error: deleteError } = await supabase.from(tableName).delete().eq("user_id", userId);
  if (deleteError) {
    if (isMissingRelationError(deleteError)) {
      throw new PreferencesUnavailableError(
        `Personalisation tables are not ready yet (${tableName}).`,
      );
    }
    throw deleteError;
  }

  if (values.length === 0) {
    return;
  }

  const rows = values.map((value) => ({
    user_id: userId,
    [columnName]: value,
  }));

  const { error: insertError } = await supabase.from(tableName).insert(rows);
  if (insertError) {
    if (isMissingRelationError(insertError)) {
      throw new PreferencesUnavailableError(
        `Personalisation tables are not ready yet (${tableName}).`,
      );
    }
    throw insertError;
  }
}

export async function loadUserEmailPreferencesForUser(
  userId: string,
  supabase: SupabaseClient,
): Promise<LoadPreferencesResult> {
  const { data, error } = await supabase
    .from("email_preferences")
    .select("user_id, personalization_enabled, frequency")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return {
        status: "unavailable",
        reason: "Email preference tables are not available yet. Legacy weekly digest remains active.",
      };
    }
    return { status: "error", error: asErrorMessage(error) };
  }

  const row = (data ?? {}) as Record<string, unknown>;
  const base: EmailPreferences = {
    personalizeEnabled: Boolean(row.personalization_enabled),
    frequency: sanitizeFrequency(row.frequency),
    categories: [],
    locations: [],
  };

  try {
    base.categories = await readStringSetTable(
      supabase,
      "email_pref_categories",
      "category",
      userId,
    );
    base.locations = await readStringSetTable(
      supabase,
      "email_pref_locations",
      "location",
      userId,
    );
  } catch (tableError) {
    if (tableError instanceof PreferencesUnavailableError) {
      return { status: "unavailable", reason: tableError.message };
    }
    return { status: "error", error: asErrorMessage(tableError) };
  }

  return { status: "ok", preferences: base };
}

export async function saveUserEmailPreferencesForUser(
  userId: string,
  preferences: EmailPreferences,
  supabase: SupabaseClient,
): Promise<SavePreferencesResult> {
  const normalized: EmailPreferences = {
    personalizeEnabled: Boolean(preferences.personalizeEnabled),
    frequency: sanitizeFrequency(preferences.frequency),
    categories: normalizeList(preferences.categories),
    locations: normalizeList(preferences.locations),
  };

  const { error: upsertError } = await supabase.from("email_preferences").upsert(
    {
      user_id: userId,
      personalization_enabled: normalized.personalizeEnabled,
      frequency: normalized.frequency,
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    if (isMissingRelationError(upsertError)) {
      return {
        status: "unavailable",
        reason: "Email preference tables are not available yet. Legacy weekly digest remains active.",
      };
    }
    return { status: "error", error: asErrorMessage(upsertError) };
  }

  try {
    await replaceStringSetTable(
      supabase,
      "email_pref_categories",
      "category",
      userId,
      normalized.categories,
    );
    await replaceStringSetTable(
      supabase,
      "email_pref_locations",
      "location",
      userId,
      normalized.locations,
    );
  } catch (tableError) {
    if (tableError instanceof PreferencesUnavailableError) {
      return { status: "unavailable", reason: tableError.message };
    }
    return { status: "error", error: asErrorMessage(tableError) };
  }

  return {
    status: "ok",
    preferences: normalized,
  };
}
