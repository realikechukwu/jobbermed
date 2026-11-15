import { COUNTRY_ALIASES, NIGERIAN_STATES, getJobPageSlug, isExpired } from "./utils";
import type { AggregatorJob } from "./types";

export const searchListingKey = (job: AggregatorJob) => job.apply_url || job._id;

export function indexSearchListings(jobs: AggregatorJob[]) {
  const bySlug = new Map<string, AggregatorJob>();
  const byId = new Map<string, string>();
  const used = new Set(["direct"]);
  const alternatives: Array<{ job: AggregatorJob; slug: string }> = [];
  const add = (job: AggregatorJob, slug: string) => {
    used.add(slug.toLowerCase());
    bySlug.set(slug, job);
    byId.set(searchListingKey(job), `/jobs/${slug}`);
  };

  for (const job of jobs) {
    const slug = getJobPageSlug(job._slug);
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(slug) || byId.has(searchListingKey(job))) continue;
    // Reserve legacy slugs before assigning a different URL to each collision.
    // Case-only collisions also matter on case-insensitive filesystems.
    if (used.has(slug.toLowerCase())) alternatives.push({ job, slug });
    else add(job, slug);
  }

  for (const { job, slug } of alternatives) {
    const id = searchListingKey(job);
    if (byId.has(id)) continue;
    let hash = 2166136261;
    for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    const base = `${slug}-${(hash >>> 0).toString(36)}`;
    let candidate = base;
    for (let n = 2; used.has(candidate.toLowerCase()); n++) candidate = `${base}-${n}`;
    add(job, candidate);
  }

  for (const [slug, job] of bySlug) {
    if (!isExpired(job.deadline)) continue;
    bySlug.delete(slug);
    byId.delete(searchListingKey(job));
  }

  return { bySlug, byId };
}

export function sourceApplyUrl(value: string) {
  try {
    const url = new URL(value);
    if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch {
    return null;
  }
  return null;
}

export function listingHasDetails(job: AggregatorJob) {
  return [...job.requirements, ...job.responsibilities].some((item) => /[\p{L}\p{N}]/u.test(item) && !/^(?:n\/?a|none|not (?:specified|listed|provided)|see (?:the )?(?:original )?(?:advert|posting|listing))\.?$/i.test(item));
}

export function listingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return "";
  const date = value.slice(0, 10);
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? "" : date;
}

export function escapeListingHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

const employmentTypes: Array<[RegExp, string]> = [
  [/\bfull[ -]?time\b/i, "FULL_TIME"],
  [/\bpart[ -]?time\b/i, "PART_TIME"],
  [/\b(?:contract(?:or)?|locum)\b/i, "CONTRACTOR"],
  [/\btemp(?:orary)?\b/i, "TEMPORARY"],
  [/\b(?:intern(?:ship)?|house officer)\b/i, "INTERN"],
  [/\bvolunteer\b/i, "VOLUNTEER"],
];

export function listingJobPosting(job: AggregatorJob, url: string, today = new Date().toISOString().slice(0, 10)) {
  const address = listingAddress(job.location);
  const datePosted = listingDate(job.date_posted);
  const deadline = listingDate(job.deadline);
  if (
    listingMeta(job, "").noindex || !address || !datePosted || datePosted > today ||
    (job.deadline && (!deadline || deadline < today || deadline < datePosted)) ||
    /^(?:company not listed|unknown|confidential|undisclosed|n\/?a)$/i.test(job.company) ||
    job.job_title === "Untitled role"
  ) return null;

  const description = [["Responsibilities", job.responsibilities], ["Requirements", job.requirements]]
    .map(([heading, items]) => Array.isArray(items) && items.length
      ? `<p><strong>${heading}</strong></p><ul>${items.map((item) => `<li>${escapeListingHtml(item)}</li>`).join("")}</ul>`
      : "")
    .join("");
  const employmentType = employmentTypes.find(([pattern]) => pattern.test(job.job_type))?.[1];
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.job_title,
    description,
    datePosted,
    ...(deadline ? { validThrough: deadline } : {}),
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: { "@type": "Organization", name: job.company },
    jobLocation: { "@type": "Place", address },
    directApply: false,
    url,
  };
}

export function listingMeta(job: AggregatorJob, path: string) {
  const { job_title: role, company, location } = job;
  const employer = company === "Company not listed" ? "" : company;
  return {
    path,
    title: `${role}${employer ? ` at ${employer}` : ""}${location ? `, ${location}` : ""} | JobberMed`,
    description: `${role}${employer ? ` at ${employer}` : ""}${location ? ` in ${location}` : ""}. View the listing and follow the link to the original job advert.`,
    noindex: !listingHasDetails(job) || !sourceApplyUrl(job.apply_url),
  };
}

const countries = new Map([["nigeria", "Nigeria"], ...COUNTRY_ALIASES]);
const nigerianRegions = new Set([...NIGERIAN_STATES.filter((state) => state !== "Niger"), "Abuja", "Abuja (FCT)", "FCT"].map((region) => region.toLowerCase()));

export function listingAddress(location: string) {
  // Only emit a physical location when we can identify the country. Avoid
  // treating a comma-separated region as a country, or inventing remote terms.
  if (/\b(?:remote|nationwide|multiple locations|across nigeria)\b|[/;]/i.test(location)) return null;

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  const lastPart = parts[parts.length - 1]?.toLowerCase() ?? "";
  const explicitCountry = countries.get(lastPart);
  const addressCountry = explicitCountry ?? (nigerianRegions.has(lastPart) ? "Nigeria" : null);
  if (explicitCountry) parts.pop();
  if (!addressCountry || parts.length === 0 || parts.length > 2) return null;

  return {
    "@type": "PostalAddress",
    addressCountry: addressCountry === "UK" ? "GB" : addressCountry,
    ...(parts.length === 2 || !nigerianRegions.has(parts[0].toLowerCase())
      ? { addressLocality: parts[0] }
      : { addressRegion: parts[0] }),
    ...(parts.length === 2 ? { addressRegion: parts[1] } : {}),
  };
}
