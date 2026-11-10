import { Link } from "react-router-dom";
import { ALL_CATEGORY, ALL_LOCATIONS } from "../constants";
import {
  LANDING_CATEGORIES,
  LANDING_LOCATION_BUCKETS,
  MIN_LANDING_JOBS,
  buildLandingPath,
  getLandingLocationName,
  getLandingMeta,
} from "../landing";
import type { CategoryCounts, LocationCounts } from "../types";

type LandingBrowseLinksProps = {
  activeCategory: string;
  activeLocation: string;
  /** Live jobs per specialty within the active location. */
  categoryCounts: CategoryCounts;
  /** Live jobs per location within the active specialty. */
  locationCounts: LocationCounts;
};

const MAX_LOCATION_LINKS = 24;

type BrowseLink = { to: string; label: string };

/** Crawlable links between landing pages, shown under the feed. */
export function LandingBrowseLinks({ activeCategory, activeLocation, categoryCounts, locationCounts }: LandingBrowseLinksProps) {
  const hasLocation = activeLocation !== ALL_LOCATIONS;
  const locationHasPage = hasLocation && LANDING_LOCATION_BUCKETS.includes(activeLocation);

  const currentPath = buildLandingPath(activeCategory, activeLocation);
  const notCurrent = (link: BrowseLink) => link.to !== currentPath;

  const specialtyLinks: BrowseLink[] = LANDING_CATEGORIES.flatMap((entry) => {
    const count = categoryCounts[entry.category] ?? 0;
    // Within a location, only link pairs that have a published page.
    const location = locationHasPage && count >= MIN_LANDING_JOBS ? activeLocation : ALL_LOCATIONS;
    if (location === ALL_LOCATIONS && (hasLocation || count === 0)) {
      return [];
    }

    const meta = getLandingMeta(entry.category, location);
    return meta ? [{ to: meta.path, label: meta.linkLabel }] : [];
  }).filter(notCurrent);

  const categoryHasPage = activeCategory === ALL_CATEGORY || LANDING_CATEGORIES.some((entry) => entry.category === activeCategory);
  const locationLinks: BrowseLink[] = categoryHasPage
    ? LANDING_LOCATION_BUCKETS.filter((bucket) => (locationCounts[bucket] ?? 0) >= MIN_LANDING_JOBS)
        .sort((left, right) => (locationCounts[right] ?? 0) - (locationCounts[left] ?? 0))
        .slice(0, MAX_LOCATION_LINKS)
        .flatMap((bucket) => {
          const to = buildLandingPath(activeCategory, bucket);
          return to ? [{ to, label: getLandingLocationName(bucket) }] : [];
        })
        .filter(notCurrent)
    : [];

  if (specialtyLinks.length === 0 && locationLinks.length === 0) {
    return null;
  }

  const activeCategoryLabel = LANDING_CATEGORIES.find((entry) => entry.category === activeCategory)?.label ?? "Healthcare";

  return (
    <nav className="browse-links" aria-label="Browse jobs by specialty and location">
      {specialtyLinks.length > 0 ? (
        <div className="browse-group">
          <h2 className="browse-heading">
            {locationHasPage ? `More jobs in ${getLandingLocationName(activeLocation)}` : "Browse by specialty"}
          </h2>
          <ul className="browse-list">
            {specialtyLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {locationLinks.length > 0 ? (
        <div className="browse-group">
          <h2 className="browse-heading">{`${activeCategoryLabel} jobs by location`}</h2>
          <ul className="browse-list">
            {locationLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
