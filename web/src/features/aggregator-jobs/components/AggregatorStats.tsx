type AggregatorStatsProps = {
  isLoading?: boolean;
  jobCountLabel: string;
  /** Words after the number, e.g. "nursing & midwifery jobs in Lagos". */
  headingText: string;
  /** e.g. ["Updated today", "Posted in the last 8 weeks"] */
  metaParts: string[];
};

export function AggregatorStats({ isLoading = false, jobCountLabel, headingText, metaParts }: AggregatorStatsProps) {
  if (isLoading) {
    return (
      <div className="results-bar" id="results" aria-live="polite">
        <h2 className="results-count" id="stat-count">
          <span className="sr-only">Loading jobs</span>
          <span className="skeleton skeleton-heading" aria-hidden="true" />
        </h2>
      </div>
    );
  }

  return (
    <div className="results-bar" id="results" aria-live="polite">
      <h2 className="results-count" id="stat-count">
        <strong>{jobCountLabel}</strong> {headingText}
      </h2>
      {metaParts.length > 0 ? (
        <p className="results-meta" id="stat-range">
          {metaParts.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
