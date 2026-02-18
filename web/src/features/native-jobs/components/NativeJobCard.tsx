import { Link } from "react-router-dom";
import { parseNativeJobAdvertMeta } from "../advert-meta";
import type { NativeJob } from "../types";

type NativeJobCardProps = {
  job: NativeJob;
};

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

function formatDescriptionPreview(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "No description provided.";
  if (trimmed.length <= 190) return trimmed;
  return `${trimmed.slice(0, 187)}...`;
}

export function NativeJobCard({ job }: NativeJobCardProps) {
  const advertMeta = parseNativeJobAdvertMeta(job.description);

  return (
    <article className="card native-job-card">
      <div className="native-job-head">
        <h2 className="title native-job-title">{job.title}</h2>
        <p className="native-job-salary">{formatSalary(job)}</p>
      </div>

      <p className="native-job-description">{formatDescriptionPreview(advertMeta.description)}</p>
      {advertMeta.companyName ? <p className="meta native-job-company">Company: {advertMeta.companyName}</p> : null}
      {advertMeta.contactInfo ? <p className="meta native-job-contact">Contact: {advertMeta.contactInfo}</p> : null}

      <div className="native-job-meta">
        {job.location ? <span className="native-chip">{job.location}</span> : null}
        {job.jobType ? <span className="native-chip">{job.jobType}</span> : null}
        {job.category ? <span className="native-chip">{job.category}</span> : null}
      </div>

      <p className="meta native-job-deadline">Apply by {formatDate(job.applyDeadline)}</p>

      <div className="native-job-actions">
        <Link className="shell-button native-job-cta" to={`/native-jobs/${job.id}`}>
          View details and apply
        </Link>
      </div>
    </article>
  );
}
