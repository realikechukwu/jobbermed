import type { AggregatorJob } from "../aggregator-jobs/types";
import { getLocationBuckets } from "../aggregator-jobs/utils";
import { parseNativeJobAdvertMeta } from "../native-jobs/advert-meta";
import { getJobTypeLabel } from "../native-jobs/job-type-options";
import type { NativeJob } from "../native-jobs/types";
import { getCategoryLabel } from "../preferences/category-options";

export type JobOrigin = "external" | "direct";

export type UnifiedJob = AggregatorJob & {
  origin: JobOrigin;
  directJobId?: string;
};

export const DIRECT_SOURCE_KEY = "jobbermed";

export function formatNativeSalary(job: NativeJob): string {
  const minimum = job.salaryMin;
  const maximum = job.salaryMax;

  if (minimum === null && maximum === null) {
    return "";
  }

  const currency = job.currency || "NGN";
  const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

  if (minimum !== null && maximum !== null) {
    return `${currency} ${numberFormatter.format(minimum)} - ${numberFormatter.format(maximum)}`;
  }

  if (minimum !== null) {
    return `${currency} ${numberFormatter.format(minimum)}+`;
  }

  return `${currency} up to ${numberFormatter.format(maximum ?? 0)}`;
}

export function aggregatorJobToUnified(job: AggregatorJob): UnifiedJob {
  return { ...job, origin: "external" };
}

export function nativeJobToUnified(job: NativeJob): UnifiedJob {
  const advertMeta = parseNativeJobAdvertMeta(job.description);
  const location = job.location ?? "";

  return {
    job_title: job.title,
    company: advertMeta.companyName ?? "Direct employer on JobberMed",
    location,
    job_type: job.jobType ? getJobTypeLabel(job.jobType) : "",
    job_category: job.category ? getCategoryLabel(job.category) : "",
    salary: formatNativeSalary(job),
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    date_posted: job.publishedAt ?? job.createdAt ?? "",
    deadline: job.applyDeadline ?? "",
    apply_url: "",
    _source: DIRECT_SOURCE_KEY,
    _locationBuckets: getLocationBuckets(location),
    _slug: `direct-${job.id}`,
    _id: `direct:${job.id}`,
    origin: "direct",
    directJobId: job.id,
  };
}

export function isDirectJob(job: UnifiedJob): boolean {
  return job.origin === "direct";
}
