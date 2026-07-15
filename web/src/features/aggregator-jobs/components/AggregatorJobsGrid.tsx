import { Link } from "react-router-dom";
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
};

export function AggregatorJobsGrid({
  jobs,
  savedOnly,
  isSaved,
  onToggleSave,
  onOpenDetail,
  hasActiveFilters = false,
  onClearFilters,
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
            <strong>No jobs found</strong>
            <span>Try adjusting your filters or search</span>
            {hasActiveFilters && onClearFilters ? (
              <button className="empty-state-action" type="button" onClick={onClearFilters}>
                Clear all filters
              </button>
            ) : null}
            <span className="empty-state-subscribe">
              Want new roles in your inbox? <Link to="/subscribe">Subscribe to the weekly digest</Link>.
            </span>
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
