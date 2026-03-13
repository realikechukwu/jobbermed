export const ALL_CATEGORY = "All";

export const ALL_LOCATIONS = "All locations";

export const PAGE_SIZE = 12;

export const CATEGORY_ORDER = [
  ALL_CATEGORY,
  "Doctors",
  "Nurses & Midwives",
  "Pharmacists",
  "Medical Laboratory Scientists",
  "Dentists",
  "Public Health",
  "Healthcare Management",
  "Allied Health",
  "Others",
] as const;

export const SOURCE_LABELS: Record<string, string> = {
  medlocum: "MedLocum Jobs",
  jobsinnigeria: "Jobs In Nigeria",
  myjobmag: "MyJobMag",
  hotnigerianjobs: "HotNigerianJobs",
  medicalworldnigeria: "Medical World Nigeria",
};

export const NEWSLETTER_STORAGE_KEY = "jobbermed_newsletter_dismissed";

export const NEWSLETTER_DISMISS_DAYS = 14;
