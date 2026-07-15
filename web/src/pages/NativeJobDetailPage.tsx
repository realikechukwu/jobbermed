import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPublishedNativeJobById } from "../features/native-jobs/api";
import { parseNativeJobAdvertMeta } from "../features/native-jobs/advert-meta";
import { NativeJobApplyForm } from "../features/native-jobs/components/NativeJobApplyForm";
import { getJobTypeLabel } from "../features/native-jobs/job-type-options";
import type { NativeJob } from "../features/native-jobs/types";
import { getCategoryLabel } from "../features/preferences/category-options";
import { RouteShell } from "../layouts/RouteShell";

function formatDate(value: string | null): string {
  if (!value) return "No deadline";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatSalary(job: NativeJob): string {
  const minimum = job.salaryMin;
  const maximum = job.salaryMax;

  if (minimum === null && maximum === null) {
    return "Salary not listed";
  }

  const currency = job.currency || "USD";
  const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

  if (minimum !== null && maximum !== null) {
    return `${currency} ${numberFormatter.format(minimum)} - ${numberFormatter.format(maximum)}`;
  }

  if (minimum !== null) {
    return `${currency} ${numberFormatter.format(minimum)}+`;
  }

  return `${currency} up to ${numberFormatter.format(maximum ?? 0)}`;
}

function normalizeParagraphs(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function NativeJobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<NativeJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function loadJobDetail() {
      if (!jobId) {
        setError("Job id is missing from the URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const jobDetail = await fetchPublishedNativeJobById(jobId);
        if (!isSubscribed) return;
        if (!jobDetail) {
          setError("Native job not found.");
          setJob(null);
          return;
        }
        setJob(jobDetail);
      } catch (loadError) {
        if (!isSubscribed) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load native job detail.";
        setError(message);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    loadJobDetail();
    return () => {
      isSubscribed = false;
    };
  }, [jobId]);

  const advertMeta = useMemo(() => {
    if (!job) {
      return { companyName: null, contactInfo: null, description: "" };
    }
    return parseNativeJobAdvertMeta(job.description);
  }, [job]);

  const descriptionParagraphs = useMemo(() => normalizeParagraphs(advertMeta.description), [advertMeta.description]);

  return (
    <RouteShell
      title={job?.title ?? "Direct Apply job details"}
      subtitle="Submit your application directly on JobberMed."
    >
      <section className="native-job-detail-page" aria-label="Direct Apply job detail">
        <Link className="native-back-link" to="/?source=direct">
          ← Back to Direct Apply jobs
        </Link>

        {isLoading ? <div className="native-jobs-state">Loading job details...</div> : null}

        {!isLoading && error ? (
          <div className="native-jobs-state native-jobs-error" role="alert">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && job ? (
          <div className="native-job-detail-layout">
            <article className="card native-job-detail-card">
              <h2 className="title">{job.title}</h2>
              <p className="native-job-detail-salary">{formatSalary(job)}</p>

              <div className="native-job-meta">
                {job.location ? <span className="native-chip">{job.location}</span> : null}
                {job.jobType ? <span className="native-chip">{getJobTypeLabel(job.jobType)}</span> : null}
                {job.category ? <span className="native-chip">{getCategoryLabel(job.category)}</span> : null}
              </div>
              {advertMeta.companyName ? (
                <p className="meta native-job-company">Company: {advertMeta.companyName}</p>
              ) : null}
              {advertMeta.contactInfo ? <p className="meta native-job-contact">Contact: {advertMeta.contactInfo}</p> : null}

              <p className="meta native-job-deadline">Application deadline: {formatDate(job.applyDeadline)}</p>

              <section className="native-detail-block">
                <h3>Job description</h3>
                {descriptionParagraphs.length > 0 ? (
                  descriptionParagraphs.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)
                ) : (
                  <p>No description provided.</p>
                )}
              </section>

              <section className="native-detail-block">
                <h3>Requirements</h3>
                {job.requirements.length > 0 ? (
                  <ul>
                    {job.requirements.map((requirement, index) => (
                      <li key={`${requirement}-${index}`}>{requirement}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No requirements provided.</p>
                )}
              </section>

              <section className="native-detail-block">
                <h3>Responsibilities</h3>
                {job.responsibilities.length > 0 ? (
                  <ul>
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={`${responsibility}-${index}`}>{responsibility}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No responsibilities provided.</p>
                )}
              </section>
            </article>

            <article className="card native-apply-card">
              <h2 className="title">Apply for this role</h2>
              <p className="meta">
                Submit your details and cover letter. Recruiters review applications directly in-platform.
              </p>
              <NativeJobApplyForm jobId={job.id} jobTitle={job.title} />
            </article>
          </div>
        ) : null}
      </section>
    </RouteShell>
  );
}
