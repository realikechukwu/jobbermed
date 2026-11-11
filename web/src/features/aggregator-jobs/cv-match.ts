import { CV_MATCH_URL } from "../blog/articles";
import type { AggregatorJob } from "./types";

export function buildCvMatchUrl(job: AggregatorJob | null): string {
  if (!job) return CV_MATCH_URL;

  const details = [
    job.location && `Location: ${job.location}`,
    job.job_type && `Job type: ${job.job_type}`,
    job.salary && `Salary: ${job.salary}`,
    job.requirements.length > 0 && `Requirements:\n${job.requirements.map((item) => `- ${item}`).join("\n")}`,
    job.responsibilities.length > 0 && `Responsibilities:\n${job.responsibilities.map((item) => `- ${item}`).join("\n")}`,
  ].filter(Boolean).join("\n\n");

  // Versioned fragment contract with jobbermed_cv/src/lib/jobPrefill.ts.
  // Fragments carry the advert without sending it in the page's HTTP request.
  const params = new URLSearchParams({
    prefill: "jobbermed-v1",
    jobTitle: job.job_title,
    companyName: job.company === "Company not listed" ? "" : job.company,
    jobDescription: details,
  });
  return `${CV_MATCH_URL}/#${params.toString()}`;
}
