import { useEffect, useRef } from "react";
import { captureEvent } from "../../lib/analytics";
import { SOURCE_LABELS } from "../aggregator-jobs/constants";
import { LANDING_LOCATION_BUCKETS } from "../aggregator-jobs/landing";
import type { AggregatorJob } from "../aggregator-jobs/types";
import { normalizeCategory } from "../aggregator-jobs/utils";
import type { JobOrigin } from "./unify";

const locations = new Set(LANDING_LOCATION_BUCKETS);
const sources = new Set(Object.keys(SOURCE_LABELS));

export type JobAnalyticsProperties = {
  job_id: string;
  job_origin: JobOrigin;
  job_source: string;
  job_category: string;
  job_location: string;
};

type JobEvent = "job viewed" | "job apply clicked" | "job application started" | "job application submitted";
type JobSurface = "job_feed" | "detail_drawer" | "listing_page" | "direct_apply";

export function jobAnalyticsProperties(job: AggregatorJob, origin: JobOrigin = "external"): JobAnalyticsProperties {
  // Feed IDs may include the source URL. Send a stable key instead of the URL or raw listing text.
  let hash = 2166136261;
  for (let index = 0; index < job._id.length; index += 1) {
    hash = Math.imul(hash ^ job._id.charCodeAt(index), 16777619);
  }

  return {
    job_id: `${origin}-${(hash >>> 0).toString(16)}`,
    job_origin: origin,
    job_source: origin === "direct" ? "jobbermed" : sources.has(job._source) ? job._source : "other",
    job_category: normalizeCategory(job),
    job_location: job._locationBuckets.find((location) => locations.has(location)) ?? "Other or unspecified",
  };
}

export function captureJobEvent(event: JobEvent, job: JobAnalyticsProperties, surface: JobSurface) {
  captureEvent(event, { ...job, surface });
}

export function useJobView(job: JobAnalyticsProperties | undefined, surface: JobSurface) {
  const previousJob = useRef<string>();

  useEffect(() => {
    if (job && previousJob.current !== job.job_id) captureJobEvent("job viewed", job, surface);
    previousJob.current = job?.job_id;
  }, [job, surface]);
}
