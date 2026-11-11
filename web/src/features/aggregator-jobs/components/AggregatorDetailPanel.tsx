import { buildCvMatchUrl } from "../cv-match";
import { useRef, type MouseEvent } from "react";
import { useFocusTrap } from "../../../hooks/useFocusTrap";
import { SOURCE_LABELS } from "../constants";
import type { AggregatorJob } from "../types";
import { formatDate, formatJobType, formatSalary, normalizeCategory, safeText } from "../utils";

type AggregatorDetailPanelProps = {
  job: AggregatorJob | null;
  isMounted: boolean;
  isClosing: boolean;
  overlayVisible: boolean;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (job: AggregatorJob) => void;
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

function renderDetailList(items: string[]) {
  if (items.length === 0) {
    return <li className="empty">Not specified</li>;
  }

  return items.map((item, index) => (
    <li key={`${item}-${index}`}>{item}</li>
  ));
}

export function AggregatorDetailPanel({
  job,
  isMounted,
  isClosing,
  overlayVisible,
  isSaved,
  onClose,
  onToggleSave,
}: AggregatorDetailPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(panelRef, isMounted && !isClosing);

  if (!isMounted) {
    return null;
  }

  const rawTitle = safeText(job?.job_title);
  const title = rawTitle || "Untitled Role";
  const hasRealTitle = rawTitle.length > 0;
  const company = safeText(job?.company);
  const location = safeText(job?.location);
  const salary = formatSalary(safeText(job?.salary)) || "Salary not listed";
  const jobType = formatJobType(safeText(job?.job_type));
  const applyUrl = safeText(job?.apply_url);
  const sourceKey = safeText(job?._source);
  const knownSourceLabel = SOURCE_LABELS[sourceKey];
  const sourceLabel = knownSourceLabel || sourceKey || "External Source";
  const posted = formatDate(safeText(job?.date_posted));
  const deadline = formatDate(safeText(job?.deadline));
  const category = job ? normalizeCategory(job) : "";
  const requirements = job?.requirements ?? [];
  const responsibilities = job?.responsibilities ?? [];

  const panelClassName = `detail-panel${isClosing ? " closing" : " visible"}`;

  function handleToggleSave(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!job) {
      return;
    }

    onToggleSave(job);
  }

  return (
    <>
      <div className={`detail-overlay${overlayVisible ? " visible" : ""}`} role="presentation" onClick={onClose} />

      <aside ref={panelRef} className={panelClassName} role="dialog" aria-modal="true" aria-labelledby="detailTitle">
        <button className="detail-close-btn" type="button" aria-label="Close panel" onClick={onClose}>
          ✕
        </button>

        <button className="detail-back-btn" type="button" onClick={onClose}>
          Back to jobs
        </button>

        <div className="detail-header">
          <div className="detail-title-row">
            <h2 className="detail-title job-detail-title" id="detailTitle">
              {title}
            </h2>

            <button
              className={`save-btn-large${isSaved ? " saved" : ""}`}
              type="button"
              aria-pressed={isSaved ? "true" : "false"}
              onClick={handleToggleSave}
            >
              <span className="save-icon" aria-hidden="true">
                <BookmarkIcon filled={isSaved} />
              </span>
              <span className="save-text">{isSaved ? "Saved" : "Save Job"}</span>
            </button>
          </div>

          <p className="detail-meta" id="detailMeta">
            <span className="job-detail-company">{company || location || "Company not listed"}</span>
            {company && location ? <span className="job-detail-location">{` - ${location}`}</span> : null}
          </p>

          <div className="detail-tags" id="detailTags">
            {posted ? <div className="tag">{`Posted ${posted}`}</div> : null}
            {category && category !== "Others" ? <div className="tag category">{category}</div> : null}
            {jobType ? <div className="tag job-type">{jobType}</div> : null}
            {deadline ? <div className="tag deadline">{`Closes ${deadline}`}</div> : null}
          </div>

          <p className="detail-salary" id="detailSalary">
            {salary}
          </p>
        </div>

        <div className="detail-divider" />

        <div className="detail-section" id="detailReqSection">
          <h4>Requirements</h4>
          <ul id="detailRequirements">{renderDetailList(requirements)}</ul>
        </div>

        <div className="detail-section" id="detailRespSection" style={{ display: responsibilities.length > 0 ? "block" : "none" }}>
          <h4>Responsibilities</h4>
          <ul id="detailResponsibilities">{renderDetailList(responsibilities)}</ul>
        </div>

        {applyUrl ? (
          <section className="detail-cv-match" aria-labelledby="detailCvMatchTitle">
            <span className="detail-cv-match-eyebrow">Before you apply</span>
            <h4 className="detail-cv-match-title" id="detailCvMatchTitle">
              {hasRealTitle ? (
                <>
                  See how well your CV matches this <span className="detail-cv-match-role">{title}</span> role
                </>
              ) : (
                "See how well your CV matches this role"
              )}
            </h4>
            <p className="detail-cv-match-body">Get a match score, find the gaps, download a tailored CV.</p>
            <a className="detail-cv-match-btn" href={buildCvMatchUrl(job)}>
              Check my CV against this job <span aria-hidden="true">→</span>
            </a>
            <p className="detail-cv-match-fine">Free · No account needed</p>
          </section>
        ) : null}

        <div className="detail-listing-info">
          <p className="detail-source">
            Source: <span id="detailSource">{sourceLabel}</span>
          </p>
          <p className="detail-disclaimer">
            <strong>About this listing:</strong> JobberMed aggregates medical jobs from multiple sources. We are not the
            employer. View the original posting for application instructions, contact details, and full job information.
          </p>
        </div>

        {/* Last in the panel and sticky, so the way to apply is always in view. */}
        <div className="detail-cta-bar">
          {applyUrl ? (
            <a className="detail-cta" id="detailCTA" href={applyUrl} target="_blank" rel="noopener noreferrer">
              {knownSourceLabel ? `Apply on ${knownSourceLabel}` : "Apply on the original site"}
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <a
              className="detail-cta disabled"
              id="detailCTA"
              href="#"
              onClick={(event) => {
                event.preventDefault();
              }}
            >
              No application link available
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
