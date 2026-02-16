import type { MouseEvent } from "react";
import type { AggregatorJob } from "../types";
import { formatDate, safeText } from "../utils";

type AggregatorJobCardProps = {
  job: AggregatorJob;
  isSaved: boolean;
  onToggleSave: (job: AggregatorJob) => void;
  onOpenDetail: (job: AggregatorJob) => void;
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

  return (
    <article className="card clickable job-card" data-job-id={job._id} onClick={handleCardClick}>
      <button
        className={`save-btn${isSaved ? " saved" : ""}`}
        type="button"
        aria-label="Save job"
        aria-pressed={isSaved ? "true" : "false"}
        onClick={handleSaveClick}
      >
        <span className="save-icon" aria-hidden="true">
          <BookmarkIcon filled={isSaved} />
        </span>
      </button>

      <h3 className="title job-title">{job.job_title || "Untitled role"}</h3>

      <div className="meta">
        {company || location ? (
          <>
            <span className="job-company">{company || location}</span>
            {company && location ? <span className="job-location">{` - ${location}`}</span> : null}
          </>
        ) : (
          <span className="job-company">Company not listed</span>
        )}
      </div>

      <div className="tags">
        {posted ? <div className="tag posted">{`Posted ${posted}`}</div> : null}
        {job.job_type ? <div className="tag job-type">{job.job_type}</div> : null}
        {deadline ? <div className="tag deadline">{`Closes ${deadline}`}</div> : null}
      </div>

      <div className="card-actions">
        <button className="view-btn" type="button" onClick={handleOpenDetail}>
          View Details
        </button>

        {applyUrl ? (
          <a className="apply-btn" href={applyUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
            Apply Now
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
