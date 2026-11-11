import type { UnifiedJob } from "../../jobs/unify";
import { AggregatorJobCard } from "./AggregatorJobCard";

type AggregatorJobsGridProps = {
  jobs: UnifiedJob[];
  savedOnly: boolean;
  isSaved: (jobId: string, slugId: string) => boolean;
  onToggleSave: (job: UnifiedJob) => void;
  onOpenDetail: (job: UnifiedJob) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  /** True when only Direct Apply jobs are being shown. */
  directOnly?: boolean;
};

export function AggregatorJobsGrid({
  jobs,
  savedOnly,
  isSaved,
  onToggleSave,
  onOpenDetail,
  hasActiveFilters = false,
  onClearFilters,
  directOnly = false,
}: AggregatorJobsGridProps) {
  if (jobs.length === 0) {
    return (
      <main className="grid" id="grid">
        {savedOnly ? (
          <div className="empty-state">
            <strong>No saved jobs yet</strong>
            <span>Click the bookmark icon on any job to save it here</span>
            {onClearFilters ? (
              <button className="empty-state-action" type="button" onClick={onClearFilters}>
                Browse all jobs
              </button>
            ) : null}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{directOnly ? "No Direct Apply jobs match right now" : "No jobs found"}</strong>
            <span>
              {directOnly
                ? "Direct Apply roles are posted by employers on JobberMed. Listings from other job boards are still available."
                : "Try adjusting your filters or search"}
            </span>
            {hasActiveFilters && onClearFilters ? (
              <button className="empty-state-action" type="button" onClick={onClearFilters}>
                {directOnly ? "Browse all jobs" : "Clear all filters"}
              </button>
            ) : null}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="grid" id="grid">
      {jobs.map((job) => (
        <AggregatorJobCard
          key={job._id}
          job={job}
          isSaved={isSaved(job._id, job._slug)}
          onToggleSave={onToggleSave}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </main>
  );
}
