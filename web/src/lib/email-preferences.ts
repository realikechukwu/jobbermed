import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailFrequency = "daily" | "weekly" | "paused";
export type DeliveryMode = "default_weekly" | "personalized";

export type EmailPreferences = {
  personalizeEnabled: boolean;
  frequency: EmailFrequency;
  weeklyDay: number;
  timezone: string;
  deliveryMode: DeliveryMode;
  categories: string[];
  locations: string[];
  jobTypes: string[];
  sources: string[];
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
  hint?: string | null;
};

const DEFAULT_TIMEZONE = "Africa/Lagos";
const DEFAULT_WEEKLY_DAY = 1;
const MISSING_RELATION_CODES = new Set(["PGRST205", "42P01"]);

export const defaultEmailPreferences: EmailPreferences = {
  personalizeEnabled: false,
  frequency: "weekly",
  weeklyDay: DEFAULT_WEEKLY_DAY,
  timezone: DEFAULT_TIMEZONE,
  deliveryMode: "default_weekly",
  categories: [],
  locations: [],
  jobTypes: [],
  sources: ["aggregated"],
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
  if (value === "daily" || value === "paused") {
    return value;
  }
  return "weekly";
}

function sanitizeWeeklyDay(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6) {
    return value;
  }
  return DEFAULT_WEEKLY_DAY;
}

function sanitizeTimezone(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return DEFAULT_TIMEZONE;
}

function sanitizeDeliveryMode(value: unknown, personalizeEnabled: boolean): DeliveryMode {
  if (value === "default_weekly" || value === "personalized") {
    return value;
  }
  return personalizeEnabled ? "personalized" : "default_weekly";
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
        `Personalization tables are not ready yet (${tableName}).`,
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
        `Personalization tables are not ready yet (${tableName}).`,
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
        `Personalization tables are not ready yet (${tableName}).`,
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
    .select("user_id, personalize_enabled, frequency, weekly_day, timezone, delivery_mode")
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
  const personalizeEnabled = Boolean(row.personalize_enabled);
  const base: EmailPreferences = {
    personalizeEnabled,
    frequency: sanitizeFrequency(row.frequency),
    weeklyDay: sanitizeWeeklyDay(row.weekly_day),
    timezone: sanitizeTimezone(row.timezone),
    deliveryMode: sanitizeDeliveryMode(row.delivery_mode, personalizeEnabled),
    categories: [],
    locations: [],
    jobTypes: [],
    sources: [],
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
    base.jobTypes = await readStringSetTable(supabase, "email_pref_job_types", "job_type", userId);
    base.sources = await readStringSetTable(supabase, "email_pref_sources", "source", userId);
  } catch (tableError) {
    if (tableError instanceof PreferencesUnavailableError) {
      return { status: "unavailable", reason: tableError.message };
    }
    return { status: "error", error: asErrorMessage(tableError) };
  }

  if (base.sources.length === 0) {
    base.sources = ["aggregated"];
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
    weeklyDay: sanitizeWeeklyDay(preferences.weeklyDay),
    timezone: sanitizeTimezone(preferences.timezone),
    deliveryMode: preferences.personalizeEnabled ? "personalized" : "default_weekly",
    categories: normalizeList(preferences.categories),
    locations: normalizeList(preferences.locations),
    jobTypes: normalizeList(preferences.jobTypes),
    sources: normalizeList(preferences.sources.length ? preferences.sources : ["aggregated"]),
  };

  const { error: upsertError } = await supabase.from("email_preferences").upsert(
    {
      user_id: userId,
      personalize_enabled: normalized.personalizeEnabled,
      frequency: normalized.frequency,
      weekly_day: normalized.weeklyDay,
      timezone: normalized.timezone,
      delivery_mode: normalized.deliveryMode,
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
    await replaceStringSetTable(
      supabase,
      "email_pref_job_types",
      "job_type",
      userId,
      normalized.jobTypes,
    );
    await replaceStringSetTable(
      supabase,
      "email_pref_sources",
      "source",
      userId,
      normalized.sources,
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
