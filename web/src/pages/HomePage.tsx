import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AggregatorDetailPanel } from "../features/aggregator-jobs/components/AggregatorDetailPanel";
import { AggregatorFilters } from "../features/aggregator-jobs/components/AggregatorFilters";
import { FooterShell } from "../components/FooterShell";
import { AggregatorJobsGrid } from "../features/aggregator-jobs/components/AggregatorJobsGrid";
import { AggregatorNewsletter } from "../features/aggregator-jobs/components/AggregatorNewsletter";
import { AggregatorPagination } from "../features/aggregator-jobs/components/AggregatorPagination";
import { AggregatorScrollTopButton } from "../features/aggregator-jobs/components/AggregatorScrollTopButton";
import { AggregatorStats } from "../features/aggregator-jobs/components/AggregatorStats";
import { HomeLegacyShell } from "../features/aggregator-jobs/components/HomeLegacyShell";
import { ALL_CATEGORY, ALL_LOCATIONS, CATEGORY_ORDER, PAGE_SIZE } from "../features/aggregator-jobs/constants";
import { useAggregatorQueryState } from "../features/aggregator-jobs/hooks/useAggregatorQueryState";
import { useUnifiedJobsData } from "../features/jobs/useUnifiedJobsData";
import { isDirectJob, type UnifiedJob } from "../features/jobs/unify";
import { useDetailPanel } from "../features/aggregator-jobs/hooks/useDetailPanel";
import { useSavedJobsLocal } from "../features/aggregator-jobs/hooks/useSavedJobsLocal";
import type { CategoryCounts, LocationCounts } from "../features/aggregator-jobs/types";
import { formatDate, interleaveBySource, isExpired, normalizeCategory, safeText } from "../features/aggregator-jobs/utils";
import "../styles/aggregator-home.css";

const AGGREGATED_JOBS_URL = `${import.meta.env.BASE_URL}data/master_jobs.json`;

const VALID_CATEGORY_SET = new Set<string>(CATEGORY_ORDER);

function buildCategoryCounts(activeJobs: Array<{ job_title: string; job_category: string }>): CategoryCounts {
  const counts: CategoryCounts = {};
  CATEGORY_ORDER.forEach((category) => {
    counts[category] = 0;
  });

  activeJobs.forEach((job) => {
    const category = normalizeCategory(job);
    counts[category] = (counts[category] ?? 0) + 1;
    counts[ALL_CATEGORY] = (counts[ALL_CATEGORY] ?? 0) + 1;
  });

  return counts;
}

function buildLocationCounts(activeJobs: Array<{ _locationBuckets: string[] }>): LocationCounts {
  const counts: LocationCounts = {};

  activeJobs.forEach((job) => {
    job._locationBuckets.forEach((bucket) => {
      counts[bucket] = (counts[bucket] ?? 0) + 1;
    });
  });

  return counts;
}

function buildListingsPeriodLabel(datesList: Array<{ date_posted: string }>): string {
  const dates = datesList
    .map((job) => safeText(job.date_posted))
    .filter((date) => date.length > 0)
    .sort();

  if (dates.length === 0) {
    return "Unknown";
  }

  const oldest = formatDate(dates[0]) ?? dates[0];
  const newest = formatDate(dates[dates.length - 1]) ?? dates[dates.length - 1];
  return `${oldest} to ${newest}`;
}

export function HomePage() {
  const { jobs, isLoading, error, directJobsError } = useUnifiedJobsData(AGGREGATED_JOBS_URL);
  const navigate = useNavigate();

  const {
    activeCategory,
    activeLocation,
    keywordQuery,
    savedOnly,
    currentPage,
    activeSource,
    setActiveCategory,
    setActiveLocation,
    setKeywordQuery,
    clearKeyword,
    setSavedOnly,
    setCurrentPage,
    setActiveSource,
    hasActiveFilters,
    clearAllFilters,
  } = useAggregatorQueryState();

  const { savedCount, isSaved, toggleSavedJob } = useSavedJobsLocal();

  const { panelJob, isMounted, isClosing, overlayVisible, openDetail, closeDetail } = useDetailPanel({ jobs });

  // Direct Apply jobs have a dedicated detail page with the application form;
  // external jobs keep the slide-in panel.
  const openJobDetail = useCallback(
    (job: UnifiedJob) => {
      if (isDirectJob(job) && job.directJobId) {
        navigate(`/jobs/direct/${job.directJobId}`);
        return;
      }

      openDetail(job);
    },
    [navigate, openDetail],
  );

  useEffect(() => {
    if (!VALID_CATEGORY_SET.has(activeCategory)) {
      setActiveCategory(ALL_CATEGORY);
    }
  }, [activeCategory, setActiveCategory]);

  const sourceJobs = useMemo(() => {
    if (activeSource === "direct") {
      return jobs.filter((job) => isDirectJob(job));
    }

    if (activeSource === "external") {
      return jobs.filter((job) => !isDirectJob(job));
    }

    return jobs;
  }, [activeSource, jobs]);

  const allActiveJobs = useMemo(() => jobs.filter((job) => !isExpired(job.deadline)), [jobs]);

  const sourceCounts = useMemo(() => {
    const direct = allActiveJobs.filter((job) => isDirectJob(job)).length;
    return {
      all: allActiveJobs.length,
      direct,
      external: allActiveJobs.length - direct,
    };
  }, [allActiveJobs]);

  const activeJobs = useMemo(() => sourceJobs.filter((job) => !isExpired(job.deadline)), [sourceJobs]);

  const categoryCounts = useMemo(
    () =>
      buildCategoryCounts(
        activeLocation === ALL_LOCATIONS
          ? activeJobs
          : activeJobs.filter((job) => job._locationBuckets.includes(activeLocation)),
      ),
    [activeJobs, activeLocation],
  );

  const locationCounts = useMemo(
    () =>
      buildLocationCounts(
        activeCategory === ALL_CATEGORY
          ? activeJobs
          : activeJobs.filter((job) => normalizeCategory(job) === activeCategory),
      ),
    [activeJobs, activeCategory],
  );

  const locationOptions = useMemo(
    () => [ALL_LOCATIONS, ...Object.keys(locationCounts).sort((left, right) => left.localeCompare(right))],
    [locationCounts],
  );

  useEffect(() => {
    if (isLoading || error) {
      return;
    }

    if (!locationOptions.includes(activeLocation)) {
      setActiveLocation(ALL_LOCATIONS);
    }
  }, [activeLocation, error, isLoading, locationOptions, setActiveLocation]);

  const filteredJobs = useMemo(() => {
    let list =
      activeCategory === ALL_CATEGORY ? sourceJobs : sourceJobs.filter((job) => normalizeCategory(job) === activeCategory);

    list = activeLocation === ALL_LOCATIONS ? list : list.filter((job) => job._locationBuckets.includes(activeLocation));

    if (keywordQuery) {
      list = list.filter((job) => {
        const haystack = [job.job_title, job.company, job.location, job.job_type, job.job_category]
          .map((value) => safeText(value))
          .join(" ")
          .toLowerCase();

        return haystack.includes(keywordQuery);
      });
    }

    if (savedOnly) {
      list = list.filter((job) => isSaved(job._id, job._slug));
    }

    list = list.filter((job) => !isExpired(job.deadline));

    // Direct Apply jobs lead the interleave order so they surface on page 1.
    const directJobs = list.filter((job) => isDirectJob(job));
    const externalJobs = list.filter((job) => !isDirectJob(job));
    return interleaveBySource([...directJobs, ...externalJobs]);
  }, [activeCategory, activeLocation, sourceJobs, keywordQuery, savedOnly, isSaved]);

  const totalPages = useMemo(() => Math.ceil(filteredJobs.length / PAGE_SIZE), [filteredJobs.length]);

  useEffect(() => {
    if (isLoading || error) {
      return;
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, error, isLoading, setCurrentPage, totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredJobs.slice(start, end);
  }, [currentPage, filteredJobs]);

  const jobCountLabel = isLoading ? "-" : String(filteredJobs.length);
  const listingsPeriodLabel = isLoading ? "-" : buildListingsPeriodLabel(filteredJobs);

  const updatedLabel = useMemo(() => {
    const latest = jobs
      .map((job) => safeText(job.date_posted))
      .filter((date) => date.length > 0)
      .sort()
      .pop();

    if (!latest) {
      return "Live jobs";
    }

    return `Live jobs - updated ${formatDate(latest) ?? latest}`;
  }, [jobs]);

  const panelIsSaved = panelJob ? isSaved(panelJob._id, panelJob._slug) : false;

  const hasKeyword = keywordQuery.trim().length > 0;

  const heroSearch = (
    <div className="hero-search">
      <input
        id="keywordSearch"
        className="hero-search-input"
        type="search"
        placeholder={'Search roles, e.g. "medical officer"'}
        aria-label="Search jobs by keyword"
        value={keywordQuery}
        onChange={(event) => setKeywordQuery(event.target.value)}
      />
      {hasKeyword ? (
        <button className="hero-search-clear" type="button" aria-label="Clear search" onClick={clearKeyword}>
          Clear
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="aggregator-home">
      <HomeLegacyShell heroSearch={heroSearch}>
        <AggregatorStats jobCountLabel={jobCountLabel} updatedLabel={updatedLabel} listingsPeriodLabel={listingsPeriodLabel} />

        <AggregatorFilters
          activeSource={activeSource}
          sourceCounts={sourceCounts}
          onSourceChange={setActiveSource}
          categoryOrder={CATEGORY_ORDER}
          categoryCounts={categoryCounts}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          locationOptions={locationOptions}
          locationCounts={locationCounts}
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          savedOnly={savedOnly}
          savedCount={savedCount}
          onToggleSaved={() => setSavedOnly(!savedOnly)}
        />

        {directJobsError ? <p className="aggregator-source-notice">{directJobsError}</p> : null}

        <AggregatorPagination
          id="paginationTop"
          ariaLabel="Pagination controls (top)"
          currentPage={currentPage}
          totalPages={totalPages}
          includeNumbers={false}
          onPageChange={setCurrentPage}
        />

        {error ? (
          <main className="grid" id="grid">
            <p className="aggregator-load-error">Could not load jobs data. Please try again later.</p>
          </main>
        ) : null}

        {!error && isLoading ? (
          <main className="grid" id="grid">
            <p className="aggregator-load-state">Loading jobs...</p>
          </main>
        ) : null}

        {!error && !isLoading ? (
          <>
            <AggregatorJobsGrid
              jobs={pageItems}
              savedOnly={savedOnly}
              isSaved={isSaved}
              onToggleSave={toggleSavedJob}
              onOpenDetail={openJobDetail}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearAllFilters}
            />

            <AggregatorPagination
              id="pagination"
              ariaLabel="Pagination controls (bottom)"
              currentPage={currentPage}
              totalPages={totalPages}
              includeNumbers
              onPageChange={setCurrentPage}
            />
          </>
        ) : null}

        <AggregatorNewsletter />
      </HomeLegacyShell>

      <AggregatorDetailPanel
        job={panelJob}
        isMounted={isMounted}
        isClosing={isClosing}
        overlayVisible={overlayVisible}
        isSaved={panelIsSaved}
        onClose={closeDetail}
        onToggleSave={toggleSavedJob}
      />

      <FooterShell />
      <AggregatorScrollTopButton />
    </div>
  );
}
