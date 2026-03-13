import type { AggregatedJobsPayload, AggregatorJob, RawJobRecord } from "./types";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const CITY_TO_STATE: Record<string, string> = {
  "abuja": "FCT",
  "fct": "FCT",
  "lagos": "Lagos",
  "kano": "Kano",
  "ibadan": "Oyo",
  "port harcourt": "Rivers",
  "benin": "Edo",
  "benin city": "Edo",
  "kaduna": "Kaduna",
  "enugu": "Enugu",
  "jos": "Plateau",
  "ilorin": "Kwara",
  "sokoto": "Sokoto",
  "calabar": "Cross River",
  "warri": "Delta",
  "owerri": "Imo",
  "uyo": "Akwa Ibom",
  "abeokuta": "Ogun",
  "maiduguri": "Borno",
  "zaria": "Kaduna",
  "aba": "Abia",
  "ogbomoso": "Oyo",
  "onitsha": "Anambra",
  "akure": "Ondo",
  "bauchi": "Bauchi",
  "yola": "Adamawa",
  "gombe": "Gombe",
  "lafia": "Nasarawa",
  "lokoja": "Kogi",
  "minna": "Niger",
  "oshogbo": "Osun",
  "asaba": "Delta",
  "awka": "Anambra",
  "birnin kebbi": "Kebbi",
  "damaturu": "Yobe",
  "dutse": "Jigawa",
  "ado ekiti": "Ekiti",
  "gusau": "Zamfara",
  "jalingo": "Taraba",
  "katsina": "Katsina",
  "umuahia": "Abia",
  "yenagoa": "Bayelsa",
  "mowe": "Ogun",
  "keffi": "Nasarawa",
};

const COUNTRY_ALIASES: Array<[needle: string, label: string]> = [
  ["uk", "UK"],
  ["united kingdom", "UK"],
  ["zambia", "Zambia"],
  ["ghana", "Ghana"],
  ["kenya", "Kenya"],
  ["uganda", "Uganda"],
  ["tanzania", "Tanzania"],
  ["rwanda", "Rwanda"],
  ["south africa", "South Africa"],
  ["united states", "United States"],
  ["usa", "United States"],
  ["canada", "Canada"],
  ["germany", "Germany"],
  ["france", "France"],
  ["netherlands", "Netherlands"],
  ["switzerland", "Switzerland"],
  ["sweden", "Sweden"],
  ["norway", "Norway"],
  ["denmark", "Denmark"],
  ["australia", "Australia"],
];

export function safeText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function toOptionalString(value: unknown): string | null {
  const text = safeText(value);
  return text.length > 0 ? text : null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => safeText(item))
      .filter((item) => item.length > 0);
  }

  const maybeString = safeText(value);
  if (!maybeString) {
    return [];
  }

  return [maybeString];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatDate(dateStr: string): string | null {
  const normalized = safeText(dateStr);
  if (!normalized) {
    return null;
  }

  const parsedDate = new Date(normalized);
  if (Number.isNaN(parsedDate.getTime())) {
    return normalized;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = parsedDate.getDate();
  const month = months[parsedDate.getMonth()];
  const year = parsedDate.getFullYear();

  return `${day} ${month} ${year}`;
}

export function isExpired(deadline: string): boolean {
  const normalized = safeText(deadline);
  if (!normalized) {
    return false;
  }

  const deadlineDate = new Date(normalized);
  if (Number.isNaN(deadlineDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

export function normalizeApplyUrl(url: string): string {
  const normalized = safeText(url);
  if (!normalized) {
    return "";
  }

  try {
    const parsed = new URL(normalized);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return normalized.split("?")[0].split("#")[0];
  }
}

export function getJobSlug(job: Pick<AggregatorJob, "apply_url" | "job_title">): string {
  if (job.apply_url) {
    const match = job.apply_url.match(/[^/]+$/);
    if (match) {
      return match[0];
    }
  }

  return (safeText(job.job_title) || "job")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

export function getJobId(job: Pick<AggregatorJob, "apply_url" | "job_title">): string {
  const normalizedUrl = normalizeApplyUrl(job.apply_url);
  return normalizedUrl || getJobSlug(job);
}

export function extractRawJobs(payload: unknown): RawJobRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RawJobRecord => Boolean(item && typeof item === "object"));
  }

  if (payload && typeof payload === "object") {
    const wrapped = payload as AggregatedJobsPayload;
    if (Array.isArray(wrapped.jobs)) {
      return wrapped.jobs.filter((item): item is RawJobRecord => Boolean(item && typeof item === "object"));
    }
  }

  return [];
}

const CATEGORY_LABEL_MAP = new Map<string, string>([
  ["doctor", "Doctors"],
  ["doctors", "Doctors"],
  ["nurse", "Nurses & Midwives"],
  ["nurses", "Nurses & Midwives"],
  ["nurses & midwives", "Nurses & Midwives"],
  ["nurses and midwives", "Nurses & Midwives"],
  ["midwife", "Nurses & Midwives"],
  ["midwives", "Nurses & Midwives"],
  ["pharmacist", "Pharmacists"],
  ["pharmacists", "Pharmacists"],
  ["medical laboratory scientist", "Medical Laboratory Scientists"],
  ["medical laboratory scientists", "Medical Laboratory Scientists"],
  ["dentist", "Dentists"],
  ["dentists", "Dentists"],
  ["public health", "Public Health"],
  ["healthcare management", "Healthcare Management"],
  ["allied health", "Allied Health"],
  ["other", "Others"],
  ["others", "Others"],
]);

function normalizeCategoryLabel(value: string): string {
  const normalized = safeText(value).toLowerCase().replace(/\s+/g, " ");
  return CATEGORY_LABEL_MAP.get(normalized) ?? "";
}

function inferCategoryFromTitle(titleOrJob: Pick<AggregatorJob, "job_title"> | string): string {
  const title = (typeof titleOrJob === "string" ? safeText(titleOrJob) : safeText(titleOrJob.job_title)).toLowerCase();

  if (!title) {
    return "Others";
  }

  if (title.includes("medical laboratory") || (title.includes("laboratory") && title.includes("scientist"))) {
    return "Medical Laboratory Scientists";
  }

  if (title.includes("dentist") || title.includes("dental")) {
    return "Dentists";
  }

  if (title.includes("pharmacist") || title.includes("pharmacy")) {
    return "Pharmacists";
  }

  if (
    title.includes("nurse") ||
    title.includes("nursing") ||
    title.includes("midwife") ||
    title.includes("midwifery") ||
    title.includes("matron")
  ) {
    return "Nurses & Midwives";
  }

  if (
    title.includes("doctor") ||
    title.includes("physician") ||
    title.includes("medical officer") ||
    title.includes("obstetrician") ||
    title.includes("gynaecologist") ||
    title.includes("oncology") ||
    title.includes("general practitioner")
  ) {
    return "Doctors";
  }

  if (
    title.includes("public health") ||
    title.includes("program officer") ||
    title.includes("programme officer") ||
    title.includes("epidemiology") ||
    title.includes("surveillance") ||
    title.includes("health systems") ||
    title.includes("health security") ||
    title.includes("project officer")
  ) {
    return "Public Health";
  }

  if (
    title.includes("director") ||
    title.includes("manager") ||
    title.includes("coordinator") ||
    title.includes("management") ||
    title.includes("provost") ||
    title.includes("hse") ||
    title.includes("inventory") ||
    title.includes("warehouse") ||
    title.includes("quality officer")
  ) {
    return "Healthcare Management";
  }

  if (
    title.includes("physiotherapist") ||
    title.includes("optometrist") ||
    title.includes("therapist") ||
    title.includes("radiographer") ||
    title.includes("dietitian") ||
    title.includes("nutritionist")
  ) {
    return "Allied Health";
  }

  return "Others";
}

export function normalizeCategory(job: Pick<AggregatorJob, "job_title" | "job_category"> | string): string {
  if (typeof job !== "string") {
    const normalizedCategory = normalizeCategoryLabel(job.job_category);
    if (normalizedCategory) {
      return normalizedCategory;
    }
  }

  return inferCategoryFromTitle(job);
}

export function getLocationBuckets(location: string): string[] {
  const raw = safeText(location);
  if (!raw) {
    return [];
  }

  const lower = raw.toLowerCase();
  const hasWord = (word: string): boolean => {
    const escapedWord = escapeRegExp(word);
    return new RegExp(`\\b${escapedWord}\\b`, "i").test(raw);
  };

  const buckets = new Set<string>();
  const isNigeria = hasWord("nigeria") || NIGERIAN_STATES.some((state) => hasWord(state.toLowerCase()));

  if (isNigeria) {
    NIGERIAN_STATES.forEach((state) => {
      if (hasWord(state.toLowerCase())) {
        buckets.add(`${state} State`);
      }
    });

    Object.entries(CITY_TO_STATE).forEach(([city, state]) => {
      if (hasWord(city)) {
        if (state === "FCT") {
          buckets.add("FCT");
        } else {
          buckets.add(`${state} State`);
        }
      }
    });

    if (buckets.size === 0) {
      return [];
    }

    return Array.from(buckets);
  }

  for (const [needle, label] of COUNTRY_ALIASES) {
    if (lower.includes(needle)) {
      return [label];
    }
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length > 1) {
    return [parts[parts.length - 1]];
  }

  return [raw];
}

export function interleaveBySource(list: AggregatorJob[]): AggregatorJob[] {
  const buckets = new Map<string, AggregatorJob[]>();
  const order: string[] = [];

  list.forEach((job) => {
    const key = safeText(job._source) || "unknown";
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(job);
    }
  });

  const interleaved: AggregatorJob[] = [];
  let added = true;

  while (added) {
    added = false;

    order.forEach((key) => {
      const bucket = buckets.get(key);
      if (bucket && bucket.length > 0) {
        const [next] = bucket.splice(0, 1);
        interleaved.push(next);
        added = true;
      }
    });
  }

  return interleaved;
}

export function normalizeJob(raw: RawJobRecord, index: number): AggregatorJob {
  const job_title = toOptionalString(raw.job_title) ?? toOptionalString(raw.title) ?? "Untitled role";
  const company = toOptionalString(raw.company) ?? toOptionalString(raw.organization) ?? "Company not listed";
  const location = toOptionalString(raw.location) ?? toOptionalString(raw.job_location) ?? "";
  const job_type = toOptionalString(raw.job_type) ?? "";
  const job_category = toOptionalString(raw.job_category) ?? "";
  const salary = toOptionalString(raw.salary) ?? "";
  const requirements = toStringArray(raw.requirements);
  const responsibilities = toStringArray(raw.responsibilities);
  const date_posted = toOptionalString(raw.date_posted) ?? "";
  const deadline = toOptionalString(raw.deadline) ?? "";
  const apply_url = toOptionalString(raw.apply_url) ?? toOptionalString(raw.job_link) ?? "";
  const _source = toOptionalString(raw._source) ?? "";

  const slug = getJobSlug({ apply_url, job_title } as Pick<AggregatorJob, "apply_url" | "job_title">);
  const stableId = getJobId({ apply_url, job_title } as Pick<AggregatorJob, "apply_url" | "job_title">);

  return {
    job_title,
    company,
    location,
    job_type,
    job_category,
    salary,
    requirements,
    responsibilities,
    date_posted,
    deadline,
    apply_url,
    _source,
    _locationBuckets: getLocationBuckets(location),
    _slug: slug || `${job_title.toLowerCase().replace(/\s+/g, "-")}-${index}`,
    _id: stableId || `${job_title}-${company}-${location}-${index}`,
  };
}

export function normalizeJobs(rawJobs: RawJobRecord[]): AggregatorJob[] {
  return rawJobs
    .map((raw, index) => normalizeJob(raw, index))
    .sort((left, right) => (right.date_posted || "").localeCompare(left.date_posted || ""));
}

export function findJobBySlug(jobs: AggregatorJob[], slug: string | null): AggregatorJob | null {
  const normalizedSlug = safeText(slug);
  if (!normalizedSlug) {
    return null;
  }

  const match = jobs.find((job) => job._slug === normalizedSlug || safeText(job.apply_url).includes(normalizedSlug));
  return match ?? null;
}
