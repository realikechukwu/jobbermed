// Human-readable copy for the results bar above the job grid, e.g.
//   "48 nursing & midwifery jobs in Lagos"
//   "Updated today · Posted in the last 8 weeks"
import { ALL_CATEGORY, ALL_LOCATIONS } from "./constants";
import type { JobSourceFilter } from "./hooks/useAggregatorQueryState";
import { formatDate, safeText } from "./utils";

// Reads naturally before "job(s)".
const ROLE_PHRASES: Record<string, string> = {
  Doctors: "doctor",
  "Nurses & Midwives": "nursing & midwifery",
  Pharmacists: "pharmacist",
  "Medical Laboratory Scientists": "med lab",
  Dentists: "dentist",
  "Public Health": "public health",
  "Healthcare Management": "healthcare management",
  "Allied Health": "allied health",
  Others: "other healthcare",
};

function placeName(locationBucket: string): string {
  if (locationBucket === "FCT") {
    return "Abuja";
  }
  return locationBucket.replace(/ State$/, "");
}

type HeadingInput = {
  count: number;
  category: string;
  location: string;
  keyword: string;
  source: JobSourceFilter;
  savedOnly: boolean;
};

/** Everything after the number, e.g. "nursing & midwifery jobs in Lagos". */
export function buildResultsHeadingText({ count, category, location, keyword, source, savedOnly }: HeadingInput): string {
  const words: string[] = [];

  if (savedOnly) {
    words.push("saved");
  }
  if (source === "direct") {
    words.push("Direct Apply");
  } else if (source === "external") {
    words.push("external");
  }
  if (category !== ALL_CATEGORY && ROLE_PHRASES[category]) {
    words.push(ROLE_PHRASES[category]);
  }

  words.push(count === 1 ? "job" : "jobs");

  if (location !== ALL_LOCATIONS) {
    words.push(`in ${placeName(location)}`);
  }

  const trimmedKeyword = keyword.trim();
  if (trimmedKeyword) {
    words.push(`matching “${trimmedKeyword}”`);
  }

  return words.join(" ");
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function daysAgo(dateStr: string, now: Date): number | null {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return Math.max(0, Math.round((startOfDay(now) - startOfDay(parsed)) / DAY_MS));
}

/** "Updated today", "Updated yesterday", "Updated 3 days ago", then a date after a week. */
export function buildUpdatedText(latestDate: string | undefined, now = new Date()): string | null {
  const date = safeText(latestDate);
  if (!date) {
    return null;
  }

  const days = daysAgo(date, now);
  if (days === null) {
    return null;
  }
  if (days === 0) {
    return "Updated today";
  }
  if (days === 1) {
    return "Updated yesterday";
  }
  if (days < 7) {
    return `Updated ${days} days ago`;
  }
  return `Updated ${formatDate(date) ?? date}`;
}

/** Age of the oldest listing shown, e.g. "Posted in the last 8 weeks". */
export function buildPostedRangeText(oldestDate: string | undefined, now = new Date()): string | null {
  const date = safeText(oldestDate);
  if (!date) {
    return null;
  }

  const days = daysAgo(date, now);
  if (days === null) {
    return null;
  }
  if (days === 0) {
    return "All posted today";
  }
  if (days < 14) {
    const span = days + 1;
    return `Posted in the last ${span} days`;
  }
  if (days < 90) {
    return `Posted in the last ${Math.ceil(days / 7)} weeks`;
  }
  return `Posted in the last ${Math.ceil(days / 30)} months`;
}
