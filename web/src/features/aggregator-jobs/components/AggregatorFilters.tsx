import type { JobSourceFilter } from "../hooks/useAggregatorQueryState";
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
  locationOptions: string[];
  locationCounts: LocationCounts;
  activeLocation: string;
  onLocationChange: (location: string) => void;
  savedOnly: boolean;
  savedCount: number;
  onToggleSaved: () => void;
};

const SOURCE_OPTIONS: Array<{ value: JobSourceFilter; label: string }> = [
  { value: "all", label: "All jobs" },
  { value: "direct", label: "Direct Apply" },
  { value: "external", label: "External" },
];

export function AggregatorFilters({
  activeSource,
  sourceCounts,
  onSourceChange,
  categoryOrder,
  categoryCounts,
  activeCategory,
  onCategoryChange,
  locationOptions,
  locationCounts,
  activeLocation,
  onLocationChange,
  savedOnly,
  savedCount,
  onToggleSaved,
}: AggregatorFiltersProps) {
  return (
    <>
      <div className="filters filters-source" aria-label="Job source filters">
        {SOURCE_OPTIONS.map((option) => {
          const isActive = option.value === activeSource;
          return (
            <button
              key={option.value}
              className={`filter-btn source-btn${isActive ? " active" : ""}`}
              type="button"
              aria-pressed={isActive ? "true" : "false"}
              onClick={() => onSourceChange(option.value)}
            >
              {`${option.label} (${sourceCounts[option.value]})`}
            </button>
          );
        })}
      </div>

      <div className="filters" id="filters">
        <div className="filter-mobile">
          <label className="filter-label" htmlFor="categorySelect">
            Category
          </label>
          <div className="select-wrap">
            <select
              id="categorySelect"
              aria-label="Filter by category"
              value={activeCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              {categoryOrder.map((category) => {
                const count = category === "All" ? categoryCounts.All ?? 0 : categoryCounts[category] ?? 0;
                return (
                  <option key={category} value={category}>
                    {`${category} (${count})`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="filter-desktop" aria-label="Category filters">
          {categoryOrder.map((category) => {
            const count = category === "All" ? categoryCounts.All ?? 0 : categoryCounts[category] ?? 0;
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                className={`filter-btn${isActive ? " active" : ""}`}
                type="button"
                aria-pressed={isActive ? "true" : "false"}
                onClick={() => onCategoryChange(category)}
              >
                {`${category} (${count})`}
              </button>
            );
          })}
        </div>

        <button
          className={`filter-btn saved-toggle${savedOnly ? " active" : ""}`}
          id="savedToggle"
          type="button"
          aria-pressed={savedOnly ? "true" : "false"}
          onClick={onToggleSaved}
        >
          {`Saved Jobs (${savedCount})`}
        </button>
      </div>

      <div className="filters">
        <div className="filter-location">
          <label className="filter-label" htmlFor="locationSelect">
            Location
          </label>
          <div className="select-wrap">
            <select
              id="locationSelect"
              aria-label="Filter by location"
              value={activeLocation}
              onChange={(event) => onLocationChange(event.target.value)}
            >
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location === "All locations" ? "All locations" : `${location} (${locationCounts[location] ?? 0})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

    </>
  );
}
