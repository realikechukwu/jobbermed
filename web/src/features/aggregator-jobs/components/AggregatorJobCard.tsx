import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { isDirectJob, type UnifiedJob } from "../../jobs/unify";
import { SOURCE_LABELS } from "../constants";
import { formatDate, formatJobType, formatSalary, getJobPageSlug, hasListedSalary, safeText } from "../utils";

type AggregatorJobCardProps = {
  job: UnifiedJob;
  isSaved: boolean;
  onToggleSave: (job: UnifiedJob) => void;
  onOpenDetail: (job: UnifiedJob) => void;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function AggregatorJobCard({ job, isSaved, onToggleSave, onOpenDetail }: AggregatorJobCardProps) {
  const company = safeText(job.company);
  const location = safeText(job.location);
  const posted = formatDate(job.date_posted);
  const deadline = formatDate(job.deadline);
  const applyUrl = safeText(job.apply_url);
  const isDirect = isDirectJob(job);
  const directDetailPath = job.directJobId ? `/jobs/direct/${job.directJobId}` : null;
  const title = job.job_title || "Untitled role";
  const jobType = formatJobType(job.job_type);
  // The listing's own address, so the title can be opened in a new tab.
  const detailPath = isDirect && directDetailPath ? directDetailPath : `/jobs/${getJobPageSlug(job._slug)}`;
  const describedJob = company ? `${title} at ${company}` : title;
  const sourceLabel = SOURCE_LABELS[safeText(job._source)];

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest(".apply-btn") || target.closest(".save-btn")) {
      return;
    }

    onOpenDetail(job);
  }

  function handleSaveClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onToggleSave(job);
  }

  function handleOpenDetail(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onOpenDetail(job);
  }

  function handleTitleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
    // Modified clicks (new tab, new window) follow the link as usual.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    onOpenDetail(job);
  }

  const initials =
    (company || job.job_title || "J")
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "J";

  return (
    <article className="card clickable job-card" data-job-id={job._id} onClick={handleCardClick}>
      <div className="job-head">
        <span className="job-avatar" aria-hidden="true">
          <span>{initials}</span>
        </span>

        <div className="job-who">
          <span className="job-company">{company || "Company not listed"}</span>
          {location ? <span className="job-location">{location}</span> : null}
        </div>

        <button
          className={`save-btn${isSaved ? " saved" : ""}`}
          type="button"
          aria-label={isSaved ? `Remove ${describedJob} from saved jobs` : `Save ${describedJob}`}
          aria-pressed={isSaved ? "true" : "false"}
          onClick={handleSaveClick}
        >
          <span className="save-icon" aria-hidden="true">
            <BookmarkIcon filled={isSaved} />
          </span>
        </button>
      </div>

      <h3 className="title job-title">
        <a className="job-title-link" href={detailPath} onClick={handleTitleClick}>
          {title}
        </a>
      </h3>

      <div className="tags">
        {isDirect ? <div className="tag direct-badge">Apply on JobberMed</div> : null}
        {jobType ? <div className="tag job-type">{jobType}</div> : null}
        {hasListedSalary(job.salary) ? <div className="tag salary">{formatSalary(job.salary)}</div> : null}
        {deadline ? <div className="tag deadline">{`Closes ${deadline}`}</div> : null}
      </div>

      <div className="card-actions">
        <span className="job-posted">{posted ? `Posted ${posted}` : ""}</span>

        <button className="view-btn" type="button" aria-label={`Details: ${describedJob}`} onClick={handleOpenDetail}>
          Details
        </button>

        {isDirect && directDetailPath ? (
          <Link
            className="apply-btn"
            to={directDetailPath}
            aria-label={`Apply: ${describedJob}`}
            onClick={(event) => event.stopPropagation()}
          >
            Apply
          </Link>
        ) : applyUrl ? (
          <a
            className="apply-btn"
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Apply: ${describedJob}${sourceLabel ? `, on ${sourceLabel}` : ""} (opens in a new tab)`}
            onClick={(event) => event.stopPropagation()}
          >
            Apply
          </a>
        ) : (
          <a
            className="apply-btn disabled"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            No link
          </a>
        )}
      </div>
    </article>
  );
}
