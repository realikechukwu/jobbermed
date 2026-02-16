import type { AggregatorJob } from "../types";
import { AggregatorJobCard } from "./AggregatorJobCard";

type AggregatorJobsGridProps = {
  jobs: AggregatorJob[];
  savedOnly: boolean;
  isSaved: (jobId: string, slugId: string) => boolean;
  onToggleSave: (job: AggregatorJob) => void;
  onOpenDetail: (job: AggregatorJob) => void;
};

export function AggregatorJobsGrid({ jobs, savedOnly, isSaved, onToggleSave, onOpenDetail }: AggregatorJobsGridProps) {
  if (jobs.length === 0) {
    return (
      <main className="grid" id="grid">
        {savedOnly ? (
          <div className="empty-state">
            <strong>No saved jobs yet</strong>
            <span>Click the bookmark icon on any job to save it here</span>
          </div>
        ) : (
          <div className="empty-state">
            <strong>No jobs found</strong>
            <span>Try adjusting your filters or search</span>
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
