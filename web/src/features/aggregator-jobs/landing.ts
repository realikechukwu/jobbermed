// Search landing pages: permanent URLs such as /doctor-jobs/lagos that show
// the home feed pre-filtered by specialty and/or location.
//
// This module is the single source for the URL scheme and the page copy. The
// app uses it for routing and meta tags, and scripts/prerender-seo.mjs bundles
// it at build time to write the static pages and sitemap, so keep it free of
// browser and React imports.
import { ALL_CATEGORY, ALL_LOCATIONS } from "./constants";
import { COUNTRY_ALIASES, NIGERIAN_STATES, getLocationBuckets, normalizeCategory, safeText } from "./utils";

export { getLocationBuckets, normalizeCategory };

/** A specialty x location page is only published (and linked) with at least this many live jobs. */
export const MIN_LANDING_JOBS = 3;

/** Path segment for location pages that span every specialty. */
export const ALL_CATEGORY_SLUG = "healthcare-jobs";

export type LandingCategory = {
  slug: string;
  /** Category label used by the feed filters. */
  category: string;
  /** Reads naturally before "jobs", e.g. "Doctor jobs". */
  label: string;
  /** Typical roles, used to give each page its own intro copy. */
  roles: string;
};

export const LANDING_CATEGORIES: LandingCategory[] = [
  {
    slug: "doctor-jobs",
    category: "Doctors",
    label: "Doctor",
    roles: "medical officer, house officer, registrar and consultant roles",
  },
  {
    slug: "nursing-jobs",
    category: "Nurses & Midwives",
    label: "Nursing & Midwifery",
    roles: "staff nurse, midwife, theatre nurse and matron roles",
  },
  {
    slug: "pharmacist-jobs",
    category: "Pharmacists",
    label: "Pharmacist",
    roles: "intern, community, hospital and superintendent pharmacist roles",
  },
  {
    slug: "medical-laboratory-scientist-jobs",
    category: "Medical Laboratory Scientists",
    label: "Medical Laboratory Scientist",
    roles: "medical laboratory scientist, technician and intern roles",
  },
  {
    slug: "dentist-jobs",
    category: "Dentists",
    label: "Dentist",
    roles: "dental surgeon, dental therapist and dental nurse roles",
  },
  {
    slug: "public-health-jobs",
    category: "Public Health",
    label: "Public Health",
    roles: "programme officer, epidemiology, surveillance and NGO health roles",
  },
  {
    slug: "healthcare-management-jobs",
    category: "Healthcare Management",
    label: "Healthcare Management",
    roles: "hospital administrator, clinic manager and health operations roles",
  },
  {
    slug: "allied-health-jobs",
    category: "Allied Health",
    label: "Allied Health",
    roles: "physiotherapist, radiographer, optometrist and dietitian roles",
  },
];

const CATEGORY_BY_SLUG = new Map(LANDING_CATEGORIES.map((entry) => [entry.slug, entry]));
const CATEGORY_BY_LABEL = new Map(LANDING_CATEGORIES.map((entry) => [entry.category, entry]));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type LandingLocation = {
  slug: string;
  /** Location bucket used by the feed filters, e.g. "Lagos State". */
  bucket: string;
  /** Short place name for headings, e.g. "Lagos". */
  name: string;
  /** Place name for titles and descriptions, e.g. "Lagos, Nigeria". */
  fullName: string;
};

const COUNTRY_HEADING_NAMES: Record<string, string> = {
  UK: "the UK",
  "United States": "the United States",
  Netherlands: "the Netherlands",
};

const LANDING_LOCATIONS: LandingLocation[] = [
  { slug: "abuja", bucket: "FCT", name: "Abuja", fullName: "Abuja (FCT), Nigeria" },
  ...NIGERIAN_STATES.map((state) => ({
    slug: slugify(state),
    bucket: `${state} State`,
    name: state === "Niger" ? "Niger State" : state,
    fullName: `${state}${state === "Niger" ? " State" : ""}, Nigeria`,
  })),
  ...Array.from(new Set(COUNTRY_ALIASES.map(([, label]) => label))).map((country) => ({
    slug: slugify(country),
    bucket: country,
    name: COUNTRY_HEADING_NAMES[country] ?? country,
    fullName: COUNTRY_HEADING_NAMES[country] ?? country,
  })),
];

const LOCATION_BY_SLUG = new Map(LANDING_LOCATIONS.map((entry) => [entry.slug, entry]));
const LOCATION_BY_BUCKET = new Map(LANDING_LOCATIONS.map((entry) => [entry.bucket, entry]));

/** Location buckets that have a landing page URL, in display order. */
export const LANDING_LOCATION_BUCKETS = LANDING_LOCATIONS.map((entry) => entry.bucket);

export function getLandingLocationName(bucket: string): string {
  return LOCATION_BY_BUCKET.get(bucket)?.name ?? bucket;
}

export type LandingFilters = {
  category: string;
  location: string;
};

/**
 * The landing URL for a specialty/location pair, "/" when neither is set, or
 * null when the pair has no landing page (the feed falls back to ?category=
 * and ?loc= on the home page).
 */
export function buildLandingPath(category: string, location: string): string | null {
  const hasCategory = category !== ALL_CATEGORY;
  const hasLocation = location !== ALL_LOCATIONS;

  if (!hasCategory && !hasLocation) {
    return "/";
  }

  const categoryEntry = hasCategory ? CATEGORY_BY_LABEL.get(category) : undefined;
  const locationEntry = hasLocation ? LOCATION_BY_BUCKET.get(location) : undefined;

  if ((hasCategory && !categoryEntry) || (hasLocation && !locationEntry)) {
    return null;
  }

  const head = categoryEntry ? categoryEntry.slug : ALL_CATEGORY_SLUG;
  return locationEntry ? `/${head}/${locationEntry.slug}` : `/${head}`;
}

/** Reads the filters out of a landing URL. Null when the path is not a landing page. */
export function parseLandingPath(pathname: string): LandingFilters | null {
  const segments = safeText(pathname)
    .split("/")
    .filter((segment) => segment.length > 0);

  if (segments.length < 1 || segments.length > 2) {
    return null;
  }

  const [head, locationSlug] = segments;
  const categoryEntry = CATEGORY_BY_SLUG.get(head);

  if (!categoryEntry && head !== ALL_CATEGORY_SLUG) {
    return null;
  }

  const locationEntry = locationSlug ? LOCATION_BY_SLUG.get(locationSlug.toLowerCase()) : undefined;
  if (locationSlug && !locationEntry) {
    return null;
  }

  // /healthcare-jobs on its own is just the home feed.
  if (!categoryEntry && !locationEntry) {
    return null;
  }

  return {
    category: categoryEntry ? categoryEntry.category : ALL_CATEGORY,
    location: locationEntry ? locationEntry.bucket : ALL_LOCATIONS,
  };
}

export type LandingMeta = {
  path: string;
  title: string;
  description: string;
  /** Page heading, sentence case, no trailing full stop. */
  heading: string;
  intro: string;
  /** Short link text, e.g. "Doctor jobs in Lagos". */
  linkLabel: string;
};

/**
 * Title, description and copy for a landing page. Null when the pair has no
 * landing page. Pass the live job count to include it in the description.
 */
export function getLandingMeta(category: string, location: string, jobCount?: number): LandingMeta | null {
  const path = buildLandingPath(category, location);
  if (!path || path === "/") {
    return null;
  }

  const categoryEntry = CATEGORY_BY_LABEL.get(category);
  const locationEntry = LOCATION_BY_BUCKET.get(location);
  const label = categoryEntry ? categoryEntry.label : "Healthcare";
  const roles = categoryEntry
    ? categoryEntry.roles
    : "roles for doctors, nurses, pharmacists, lab scientists and allied health professionals";
  const count = typeof jobCount === "number" && jobCount > 0 ? jobCount : null;
  const lowerLabel = label.toLowerCase();
  const jobsWord = count === 1 ? "job" : "jobs";

  if (locationEntry) {
    return {
      path,
      title: `${label} Jobs in ${locationEntry.fullName} | JobberMed`,
      description: `${count ? `Browse ${count} live` : "Browse live"} ${lowerLabel} ${jobsWord} in ${locationEntry.fullName}: ${roles}. New vacancies added daily on JobberMed.`,
      heading: `${label} jobs in ${locationEntry.name}`,
      intro: `${count ? `${count} live` : "Live"} ${lowerLabel} ${jobsWord} in ${locationEntry.name}, including ${roles}. Gathered daily from trusted job boards.`,
      linkLabel: `${label} jobs in ${locationEntry.name}`,
    };
  }

  return {
    path,
    title: `${label} Jobs in Nigeria & Africa | JobberMed`,
    description: `${count ? `Browse ${count} live` : "Browse live"} ${lowerLabel} ${jobsWord} in Nigeria and across Africa: ${roles}. New vacancies added daily on JobberMed.`,
    heading: `${label} jobs in Nigeria and Africa`,
    intro: `${count ? `${count} live` : "Live"} ${lowerLabel} ${jobsWord} across Nigeria and Africa, including ${roles}. Gathered daily from trusted job boards.`,
    linkLabel: `${label} jobs`,
  };
}
