import { type CategoryCounts, type LocationCounts } from "../types";

type AggregatorFiltersProps = {
  categoryOrder: readonly string[];
  categoryCounts: CategoryCounts;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  locationOptions: string[];
  locationCounts: LocationCounts;
  activeLocation: string;
  onLocationChange: (location: string) => void;
  keywordQuery: string;
  onKeywordQueryChange: (keyword: string) => void;
  onKeywordClear: () => void;
  savedOnly: boolean;
  savedCount: number;
  onToggleSaved: () => void;
};

export function AggregatorFilters({
  categoryOrder,
  categoryCounts,
  activeCategory,
  onCategoryChange,
  locationOptions,
  locationCounts,
  activeLocation,
  onLocationChange,
  keywordQuery,
  onKeywordQueryChange,
  onKeywordClear,
  savedOnly,
  savedCount,
  onToggleSaved,
}: AggregatorFiltersProps) {
  const hasKeyword = keywordQuery.trim().length > 0;

  return (
    <>
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

      <div className="filters">
        <div className="filter-search">
          <label className="filter-label" htmlFor="keywordSearch">
            Keyword search
          </label>
          <div className="search-wrap">
            <input
              id="keywordSearch"
              className="search-input"
              type="text"
              placeholder={'eg "medical officer"'}
              aria-label="Search jobs by keyword"
              value={keywordQuery}
              onChange={(event) => onKeywordQueryChange(event.target.value)}
            />

            <button
              className={`search-clear${hasKeyword ? " visible" : ""}`}
              id="searchClear"
              type="button"
              aria-label="Clear search"
              onClick={onKeywordClear}
            >
              x
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
