type AggregatorStatsProps = {
  jobCountLabel: string;
  updatedLabel: string;
  listingsPeriodLabel: string;
};

export function AggregatorStats({ jobCountLabel, updatedLabel, listingsPeriodLabel }: AggregatorStatsProps) {
  return (
    <div className="results-bar" aria-live="polite">
      <h2 className="results-count" id="stat-count">
        <strong>{jobCountLabel}</strong> {jobCountLabel === "1" ? "job" : "jobs"}
      </h2>
      <p className="results-meta" id="stat-range">
        <span>{updatedLabel}</span>
        <span>{`Listings from ${listingsPeriodLabel}`}</span>
      </p>
    </div>
  );
}
