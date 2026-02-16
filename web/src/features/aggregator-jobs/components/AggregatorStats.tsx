type AggregatorStatsProps = {
  jobCountLabel: string;
  listingsPeriodLabel: string;
};

export function AggregatorStats({ jobCountLabel, listingsPeriodLabel }: AggregatorStatsProps) {
  return (
    <header>
      <div className="stats-wrap">
        <div className="stat" id="stat-count">
          <strong>{jobCountLabel}</strong>
          <span>Live jobs - updated automatically</span>
        </div>

        <div className="stat" id="stat-range">
          <strong>{listingsPeriodLabel}</strong>
          <span>Listings period</span>
        </div>
      </div>
    </header>
  );
}
