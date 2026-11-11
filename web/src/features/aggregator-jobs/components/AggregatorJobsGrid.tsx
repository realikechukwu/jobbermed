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
  /** True when only Direct Apply jobs are being shown. */
  directOnly?: boolean;
  keyword?: string;
  /** Live jobs matching the keyword once every other filter is removed. */
  keywordOnlyCount?: number;
  onClearKeyword?: () => void;
  onKeepKeywordOnly?: () => void;
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
  keyword = "",
  keywordOnlyCount = 0,
  onClearKeyword,
  onKeepKeywordOnly,
}: AggregatorJobsGridProps) {
  const hasKeyword = keyword.trim().length > 0;

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
        ) : hasKeyword ? (
          <div className="empty-state">
            <strong>{`No jobs match “${keyword}”`}</strong>
            {keywordOnlyCount > 0 ? (
              <>
                <span>
                  {`Your other filters are hiding ${keywordOnlyCount} ${keywordOnlyCount === 1 ? "job that matches" : "jobs that match"} this search.`}
                </span>
                {onKeepKeywordOnly ? (
                  <button className="empty-state-action" type="button" onClick={onKeepKeywordOnly}>
                    {`Show ${keywordOnlyCount === 1 ? "that job" : `all ${keywordOnlyCount} jobs`}`}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <span>Check the spelling, or try a broader word such as “nurse”, “pharmacist” or a hospital name.</span>
                {onClearKeyword ? (
                  <button className="empty-state-action" type="button" onClick={onClearKeyword}>
                    Clear search
                  </button>
                ) : null}
              </>
            )}
            <Link className="empty-state-link" to="/account/personalization">
              Get new jobs by email instead
            </Link>
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
