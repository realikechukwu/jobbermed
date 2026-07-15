import { useRef, type MouseEvent } from "react";
import { useFocusTrap } from "../../../hooks/useFocusTrap";
import { SOURCE_LABELS } from "../constants";
import type { AggregatorJob } from "../types";
import { formatDate, normalizeCategory, safeText } from "../utils";

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

  const title = safeText(job?.job_title) || "Untitled Role";
  const company = safeText(job?.company);
  const location = safeText(job?.location);
  const salary = safeText(job?.salary) || "Salary not listed";
  const applyUrl = safeText(job?.apply_url);
  const sourceKey = safeText(job?._source);
  const sourceLabel = SOURCE_LABELS[sourceKey] || sourceKey || "External Source";
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

      <aside ref={panelRef} className={panelClassName} aria-hidden="false" role="dialog" aria-labelledby="detailTitle">
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
            {job?.job_type ? <div className="tag job-type">{job.job_type}</div> : null}
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

        <div className="aggregator-notice">
          <strong>About this listing</strong>
          <p>
            JobberMed aggregates medical jobs from multiple sources. We are not the employer. View the original posting
            below for application instructions, contact details, and full job information.
          </p>
        </div>

        <p className="detail-source">
          Source: <span id="detailSource">{sourceLabel}</span>
        </p>

        {applyUrl ? (
          <a className="detail-cta" id="detailCTA" href={applyUrl} target="_blank" rel="noopener noreferrer">
            View Original Posting
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
      </aside>
    </>
  );
}
