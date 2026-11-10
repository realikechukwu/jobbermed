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
              aria-label={`${category}, ${count} jobs`}
              onClick={() => onCategoryChange(category)}
            >
              <span className="story-ring">
                <span className="story-count">{count}</span>
              </span>
              <span className="story-label">{CATEGORY_SHORT_LABELS[category] ?? category}</span>
            </button>
          );
        })}
      </nav>

      <div className="toolbar">
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

        <div className="toolbar-end">
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
    </>
  );
}
