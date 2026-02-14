import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { NativeJobCard } from "../features/native-jobs/components/NativeJobCard";
import { fetchPublishedNativeJobs } from "../features/native-jobs/api";
import type { NativeJob } from "../features/native-jobs/types";
import { RouteShell } from "../layouts/RouteShell";

export function NativeJobsPage() {
  const [jobs, setJobs] = useState<NativeJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isSubscribed = true;

    async function loadJobs() {
      setIsLoading(true);
      setError(null);
      try {
        const nativeJobs = await fetchPublishedNativeJobs();
        if (!isSubscribed) return;
        setJobs(nativeJobs);
      } catch (loadError) {
        if (!isSubscribed) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load native jobs.";
        setError(message);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    loadJobs();
    return () => {
      isSubscribed = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return jobs;

    return jobs.filter((job) => {
      const searchTarget = [job.title, job.location, job.jobType, job.category]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();
      return searchTarget.includes(normalizedQuery);
    });
  }, [jobs, query]);

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  return (
    <RouteShell title="Native healthcare jobs" subtitle="Apply directly to employers on JobberMed.">
      <section className="native-jobs-page" aria-label="Native jobs listing">
        <article className="card native-jobs-intro">
          <h2 className="title">Direct applications</h2>
          <p className="meta">
            Browse verified employer postings and submit applications directly in-platform.
          </p>
          <p className="native-jobs-count">
            {isLoading ? "Loading jobs..." : `${filteredJobs.length} open native jobs`}
          </p>
        </article>

        <div className="native-jobs-controls">
          <label className="shell-label" htmlFor="native-job-search">
            Search native jobs
          </label>
          <input
            className="shell-input native-jobs-search-input"
            id="native-job-search"
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Role, category, location, or job type"
          />
        </div>

        {error ? (
          <div className="native-jobs-state native-jobs-error" role="alert">
            {error}
          </div>
        ) : null}

        {isLoading ? <div className="native-jobs-state">Loading native jobs...</div> : null}

        {!isLoading && !error && filteredJobs.length === 0 ? (
          <div className="native-jobs-state">No native jobs match your search.</div>
        ) : null}

        {!isLoading && !error && filteredJobs.length > 0 ? (
          <div className="native-jobs-grid">
            {filteredJobs.map((job) => (
              <NativeJobCard key={job.id} job={job} />
            ))}
          </div>
        ) : null}
      </section>
    </RouteShell>
  );
}
