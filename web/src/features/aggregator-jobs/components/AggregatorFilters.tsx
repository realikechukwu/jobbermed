import { ALL_CATEGORY, ALL_LOCATIONS } from "../constants";
import type { JobSort, JobSourceFilter } from "../hooks/useAggregatorQueryState";
import { JOB_TYPE_FILTERS, type JobTypeFilter } from "../utils";
import { type CategoryCounts, type LocationCounts } from "../types";

type SourceCounts = {
  all: number;
  direct: number;
  external: number;
};

type AggregatorFiltersProps = {
  activeSource: JobSourceFilter;
  sourceCounts: SourceCounts;
  onSourceChange: (source: JobSourceFilter) => void;
  categoryOrder: readonly string[];
  categoryCounts: CategoryCounts;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isLoading: boolean;
  locationOptions: string[];
  popularLocations: string[];
  activeJobType: JobTypeFilter | "";
  onJobTypeChange: (jobType: JobTypeFilter | "") => void;
  salaryOnly: boolean;
  onToggleSalary: () => void;
  activeSort: JobSort;
  onSortChange: (sort: JobSort) => void;
  locationCounts: LocationCounts;
  activeLocation: string;
  onLocationChange: (location: string) => void;
  savedOnly: boolean;
  savedCount: number;
  onToggleSaved: () => void;
  keywordQuery: string;
  onClearKeyword: () => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
};

const SOURCE_OPTIONS: Array<{ value: JobSourceFilter; label: string }> = [
  { value: "all", label: "All jobs" },
  { value: "direct", label: "Direct Apply" },
  { value: "external", label: "External" },
];

const SORT_OPTIONS: Array<{ value: JobSort; label: string }> = [
  { value: "recommended", label: "Sort: Recommended" },
  { value: "newest", label: "Sort: Newest" },
  { value: "closing", label: "Sort: Closing soon" },
];

// Short labels keep the story row to two lines under each ring.
const CATEGORY_SHORT_LABELS: Record<string, string> = {
  All: "All roles",
  "Medical Laboratory Scientists": "Med Lab",
  "Healthcare Management": "Management",
};

export function AggregatorFilters({
  activeSource,
  sourceCounts,
  onSourceChange,
  categoryOrder,
  categoryCounts,
  activeCategory,
  onCategoryChange,
  isLoading,
  locationOptions,
  popularLocations,
  activeJobType,
  onJobTypeChange,
  salaryOnly,
  onToggleSalary,
  activeSort,
  onSortChange,
  locationCounts,
  activeLocation,
  onLocationChange,
  savedOnly,
  savedCount,
  onToggleSaved,
  keywordQuery,
  onClearKeyword,
  hasActiveFilters,
  onClearAll,
}: AggregatorFiltersProps) {
  const hasKeyword = keywordQuery.trim().length > 0;
  const hasRole = activeCategory !== ALL_CATEGORY;
  const hasLocation = activeLocation !== ALL_LOCATIONS;
  const jobTypeLabel = JOB_TYPE_FILTERS.find((option) => option.value === activeJobType)?.label;
  // With no Direct Apply jobs live the source tabs would only offer an empty
  // view, so they stay hidden unless that view is already selected.
  const showSourceTabs = !isLoading && (sourceCounts.direct > 0 || activeSource !== "all");
  const locationLabel = (location: string) => `${location} (${locationCounts[location] ?? 0})`;
  const allLocations = locationOptions.filter((location) => location !== ALL_LOCATIONS);

  return (
    <>
      <nav className="stories" id="filters" aria-label="Filter by specialty">
        {categoryOrder.map((category) => {
          const count = categoryCounts[category] ?? 0;
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              className={`story${isActive ? " active" : ""}`}
              type="button"
              aria-pressed={isActive ? "true" : "false"}
              aria-label={isLoading ? category : `${category}, ${count} jobs`}
              onClick={() => onCategoryChange(category)}
            >
              <span className="story-ring">
                <span className={`story-count${isLoading ? " is-loading" : ""}`}>{isLoading ? "" : count}</span>
              </span>
              <span className="story-label">{CATEGORY_SHORT_LABELS[category] ?? category}</span>
            </button>
          );
        })}
      </nav>

      <div className={`toolbar${showSourceTabs ? "" : " toolbar--no-source"}`}>
        {showSourceTabs ? (
        <div className="segmented" role="group" aria-label="Job source">
          {SOURCE_OPTIONS.map((option) => {
            const isActive = option.value === activeSource;
            return (
              <button
                key={option.value}
                className={`segmented-btn${isActive ? " active" : ""}`}
                type="button"
                aria-pressed={isActive ? "true" : "false"}
                onClick={() => onSourceChange(option.value)}
              >
                {option.label}
                <span className="segmented-count">{sourceCounts[option.value]}</span>
              </button>
            );
          })}
        </div>
        ) : null}

        <div className="toolbar-end">
          <div className="select-wrap">
            <select
              id="locationSelect"
              aria-label="Filter by location"
              value={activeLocation}
              onChange={(event) => onLocationChange(event.target.value)}
            >
              <option value={ALL_LOCATIONS}>{ALL_LOCATIONS}</option>
              {popularLocations.length > 0 && allLocations.length > popularLocations.length ? (
                <optgroup label="Most jobs">
                  {popularLocations.map((location) => (
                    <option key={`popular-${location}`} value={location}>
                      {locationLabel(location)}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <optgroup label="All locations (A to Z)">
                {allLocations.map((location) => (
                  <option key={location} value={location}>
                    {locationLabel(location)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="select-wrap">
            <select
              id="jobTypeSelect"
              aria-label="Filter by job type"
              value={activeJobType}
              onChange={(event) => onJobTypeChange(event.target.value as JobTypeFilter | "")}
            >
              <option value="">All job types</option>
              {JOB_TYPE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="select-wrap">
            <select
              id="sortSelect"
              aria-label="Sort jobs"
              value={activeSort}
              onChange={(event) => onSortChange(event.target.value as JobSort)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className={`pill-btn${salaryOnly ? " active" : ""}`}
            type="button"
            aria-pressed={salaryOnly ? "true" : "false"}
            onClick={onToggleSalary}
          >
            Salary shown
          </button>

          <button
            className={`pill-btn saved-toggle${savedOnly ? " active" : ""}`}
            id="savedToggle"
            type="button"
            aria-pressed={savedOnly ? "true" : "false"}
            onClick={onToggleSaved}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                fill={savedOnly ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
              />
            </svg>
            {`Saved (${savedCount})`}
          </button>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="active-filters" aria-label="Active filters">
          {hasKeyword ? (
            <button
              className="filter-chip"
              type="button"
              aria-label={`Remove search: ${keywordQuery}`}
              onClick={onClearKeyword}
            >
              “{keywordQuery}”
              <span className="filter-chip-x" aria-hidden="true">×</span>
            </button>
          ) : null}
          {hasRole ? (
            <button
              className="filter-chip"
              type="button"
              aria-label={`Remove role filter: ${activeCategory}`}
              onClick={() => onCategoryChange(ALL_CATEGORY)}
            >
              {CATEGORY_SHORT_LABELS[activeCategory] ?? activeCategory}
              <span className="filter-chip-x" aria-hidden="true">×</span>
            </button>
          ) : null}
          {hasLocation ? (
            <button
              className="filter-chip"
              type="button"
              aria-label={`Remove location filter: ${activeLocation}`}
              onClick={() => onLocationChange(ALL_LOCATIONS)}
            >
              {activeLocation}
              <span className="filter-chip-x" aria-hidden="true">×</span>
            </button>
          ) : null}
          {jobTypeLabel ? (
            <button
              className="filter-chip"
              type="button"
              aria-label={`Remove job type filter: ${jobTypeLabel}`}
              onClick={() => onJobTypeChange("")}
            >
              {jobTypeLabel}
              <span className="filter-chip-x" aria-hidden="true">×</span>
            </button>
          ) : null}
          {salaryOnly ? (
            <button className="filter-chip" type="button" aria-label="Remove filter: salary shown" onClick={onToggleSalary}>
              Salary shown
              <span className="filter-chip-x" aria-hidden="true">×</span>
            </button>
          ) : null}
          <button className="filter-clear-all" type="button" onClick={onClearAll}>
            Clear all filters
          </button>
        </div>
      ) : null}
    </>
  );
}
