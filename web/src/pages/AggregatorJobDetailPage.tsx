import { useEffect, useMemo, type MouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { SOURCE_LABELS } from "../features/aggregator-jobs/constants";
import { buildCvMatchUrl } from "../features/aggregator-jobs/cv-match";
import { useAggregatorJobsData } from "../features/aggregator-jobs/hooks/useAggregatorJobsData";
import { useSavedJobsLocal } from "../features/aggregator-jobs/hooks/useSavedJobsLocal";
import { indexSearchListings, listingMeta, sourceApplyUrl } from "../features/aggregator-jobs/search-listings";
import { formatDate, formatJobType, formatSalary } from "../features/aggregator-jobs/utils";
import { captureJobEvent, jobAnalyticsProperties, useJobView } from "../features/jobs/analytics";
import { RouteShell } from "../layouts/RouteShell";
import { applyPageMeta } from "../lib/seo";
import { NotFoundPage } from "./NotFoundPage";

export function AggregatorJobDetailPage() {
  const { jobSlug } = useParams();
  const { jobs, isLoading, error } = useAggregatorJobsData(`${import.meta.env.BASE_URL}data/master_jobs.json`);
  const { isSaved, toggleSavedJob } = useSavedJobsLocal();
  const job = useMemo(() => indexSearchListings(jobs).bySlug.get(jobSlug ?? ""), [jobs, jobSlug]);
  const analyticsJob = job && !isLoading && !error ? jobAnalyticsProperties(job) : undefined;
  useJobView(analyticsJob, "listing_page");

  useEffect(() => {
    if (isLoading || error) return;
    if (job) {
      applyPageMeta(listingMeta(job, `/jobs/${jobSlug}`));
    } else {
      document.head.querySelectorAll("script[data-route-schema]").forEach((script) => script.remove());
      applyPageMeta({ title: "Job not found | JobberMed", noindex: true, path: null });
    }
  }, [error, isLoading, job, jobSlug]);

  if (isLoading || error) {
    return <RouteShell title="Healthcare job"><p role="status">{error ? "Job details are temporarily unavailable." : "Loading job details…"}</p></RouteShell>;
  }
  if (!job) return <NotFoundPage />;

  const employer = job.company === "Company not listed" ? "" : job.company;
  const heading = employer ? `${job.job_title} at ${employer}` : job.job_title;
  const applyUrl = sourceApplyUrl(job.apply_url);
  const source = SOURCE_LABELS[job._source];
  const posted = formatDate(job.date_posted);
  const deadline = formatDate(job.deadline);
  const saved = isSaved(job._id, job._slug);
  const facts = [
    ["Employer", employer], ["Location", job.location], ["Job type", formatJobType(job.job_type)],
    ["Salary", formatSalary(job.salary)], ["Posted", posted], ["Closes", deadline],
  ].filter(([, value]) => value);

  function handleApplyClick(event: MouseEvent<HTMLAnchorElement>) {
    if (analyticsJob && (event.button === 0 || event.button === 1)) {
      captureJobEvent("job apply clicked", analyticsJob, "listing_page");
    }
  }

  return (
    <RouteShell title={heading}>
      <main className="native-job-detail-page">
        <Link className="native-back-link" to="/">← Browse healthcare jobs</Link>
        <article className="card native-job-detail-card">
          <dl className="external-job-facts">
            {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          {([ ["Responsibilities", job.responsibilities], ["Requirements", job.requirements] ] as const).map(([title, items]) => items.length > 0 && (
            <section key={title} className="native-detail-block">
              <h2>{title}</h2>
              <ul>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
            </section>
          ))}
          <div className="external-job-actions">
            {applyUrl && <a className="shell-button" href={applyUrl} onClick={handleApplyClick} onAuxClick={handleApplyClick}>{source ? `Apply on ${source}` : "Apply on the original site"}</a>}
            <button className="shell-button" type="button" aria-pressed={saved} onClick={() => toggleSavedJob(job)}>{saved ? "Saved" : "Save job"}</button>
            {applyUrl && <a href={buildCvMatchUrl(job)}>Check my CV against this job</a>}
          </div>
        </article>
      </main>
    </RouteShell>
  );
}
