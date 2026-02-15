import { useEffect, useMemo, useState } from "react";
import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

const AGGREGATED_JOBS_URL = `${import.meta.env.BASE_URL}data/master_jobs.json`;

type RawJobRecord = Record<string, unknown>;

type AggregatedJobCard = {
  id: string;
  title: string;
  company: string;
  location: string;
  applyUrl: string;
  category: string;
  jobType: string;
  datePosted: string;
};

type AggregatedJobsPayload = {
  jobs?: unknown;
};

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRawJobs(payload: unknown): RawJobRecord[] {
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

function mapRawJobToCard(raw: RawJobRecord, index: number): AggregatedJobCard {
  const title = toOptionalString(raw.job_title) ?? toOptionalString(raw.title) ?? "Untitled role";
  const company = toOptionalString(raw.organization) ?? toOptionalString(raw.company) ?? "Company not listed";
  const location = toOptionalString(raw.job_location) ?? toOptionalString(raw.location) ?? "Location not listed";
  const applyUrl = toOptionalString(raw.job_link) ?? toOptionalString(raw.apply_url) ?? "";
  const category = toOptionalString(raw.job_category) ?? "Uncategorized";
  const jobType = toOptionalString(raw.job_type) ?? "Unspecified";
  const datePosted = toOptionalString(raw.date_posted) ?? "Date not specified";

  return {
    id: applyUrl || `${title}-${company}-${location}-${index}`,
    title,
    company,
    location,
    applyUrl,
    category,
    jobType,
    datePosted,
  };
}

export function HomePage() {
  const [jobs, setJobs] = useState<AggregatedJobCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jobsLoadError, setJobsLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    let isSubscribed = true;

    async function loadAggregatedJobs() {
      setIsLoading(true);
      try {
        const response = await fetch(AGGREGATED_JOBS_URL);
        if (!response.ok) {
          throw new Error(`Unable to load aggregated jobs (${response.status}).`);
        }

        const payload = (await response.json()) as unknown;
        if (!isSubscribed) return;
        const parsedJobs = normalizeRawJobs(payload).map((row, index) => mapRawJobToCard(row, index));
        setJobs(parsedJobs);
        setJobsLoadError(null);
      } catch (error) {
        if (!isSubscribed) return;
        const message = error instanceof Error ? error.message : "Unable to load aggregated jobs.";
        setJobsLoadError(message);
        setJobs([]);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    void loadAggregatedJobs();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const unique = new Set<string>();
    jobs.forEach((job) => unique.add(job.category));
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const locationOptions = useMemo(() => {
    const unique = new Set<string>();
    jobs.forEach((job) => unique.add(job.location));
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      if (categoryFilter !== "all" && job.category !== categoryFilter) {
        return false;
      }

      if (locationFilter !== "all" && job.location !== locationFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchTarget = [job.title, job.company, job.location, job.category, job.jobType].join(" ").toLowerCase();
      return searchTarget.includes(normalizedQuery);
    });
  }, [jobs, query, categoryFilter, locationFilter]);

  return (
    <RouteShell
      title="Healthcare jobs across Nigeria and Africa."
      subtitle="Delivered to your email every week."
    >
      <section className="native-jobs-page" aria-label="Aggregated jobs">
        <CardPrimitive title="Live jobs" meta="Latest pipeline output served from /data/master_jobs.json.">
          <p className="meta">{isLoading ? "Loading aggregated jobs..." : `${filteredJobs.length} jobs shown`}</p>
        </CardPrimitive>

        <div className="native-jobs-controls">
          <label className="shell-label" htmlFor="aggregated-job-search">
            Search jobs
          </label>
          <input
            className="shell-input native-jobs-search-input"
            id="aggregated-job-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Role, company, category, location, or job type"
          />

          <label className="shell-label" htmlFor="aggregated-category-filter">
            Category
          </label>
          <select
            className="shell-input"
            id="aggregated-category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All categories" : option}
              </option>
            ))}
          </select>

          <label className="shell-label" htmlFor="aggregated-location-filter">
            Location
          </label>
          <select
            className="shell-input"
            id="aggregated-location-filter"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
          >
            {locationOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All locations" : option}
              </option>
            ))}
          </select>
        </div>

        {jobsLoadError ? (
          <div className="native-jobs-state native-jobs-error" role="alert">
            Failed to load aggregated jobs: {jobsLoadError}
          </div>
        ) : null}

        {!jobsLoadError && !isLoading && jobs.length === 0 ? (
          <div className="native-jobs-state" role="status">
            Aggregated jobs JSON loaded but no valid items were parsed. Check JSON shape and field mappings.
          </div>
        ) : null}

        {!jobsLoadError && !isLoading && jobs.length > 0 && filteredJobs.length === 0 ? (
          <div className="native-jobs-state" role="status">
            No jobs match your current filters.
          </div>
        ) : null}

        {!jobsLoadError && filteredJobs.length > 0 ? (
          <div className="native-jobs-grid">
            {filteredJobs.map((job) => (
              <CardPrimitive key={job.id} title={job.title} meta={`${job.company} • ${job.location}`}>
                <p className="meta">
                  {job.category} • {job.jobType}
                </p>
                <p className="meta">Posted: {job.datePosted}</p>
                {job.applyUrl ? (
                  <a className="shell-inline-link" href={job.applyUrl} target="_blank" rel="noreferrer">
                    Apply now
                  </a>
                ) : (
                  <p className="meta">Apply link unavailable.</p>
                )}
              </CardPrimitive>
            ))}
          </div>
        ) : null}
      </section>
    </RouteShell>
  );
}
