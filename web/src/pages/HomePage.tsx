import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildPostedRangeText, buildResultsHeadingText, buildUpdatedText } from "../features/aggregator-jobs/results-summary";
import { useNavigate } from "react-router-dom";
import { AggregatorDetailPanel } from "../features/aggregator-jobs/components/AggregatorDetailPanel";
import { AggregatorFilters } from "../features/aggregator-jobs/components/AggregatorFilters";
import { FooterShell } from "../components/FooterShell";
import { AggregatorJobsGrid } from "../features/aggregator-jobs/components/AggregatorJobsGrid";
import { AggregatorPagination } from "../features/aggregator-jobs/components/AggregatorPagination";
import { AggregatorScrollTopButton } from "../features/aggregator-jobs/components/AggregatorScrollTopButton";
import { AggregatorStats } from "../features/aggregator-jobs/components/AggregatorStats";
import { LandingBrowseLinks } from "../features/aggregator-jobs/components/LandingBrowseLinks";
import { HomeLegacyShell } from "../features/aggregator-jobs/components/HomeLegacyShell";
import { ALL_CATEGORY, ALL_LOCATIONS, CATEGORY_ORDER, PAGE_SIZE } from "../features/aggregator-jobs/constants";
import { getLandingMeta } from "../features/aggregator-jobs/landing";
import { useAggregatorQueryState } from "../features/aggregator-jobs/hooks/useAggregatorQueryState";
import { useUnifiedJobsData } from "../features/jobs/useUnifiedJobsData";
import { isDirectJob, type UnifiedJob } from "../features/jobs/unify";
import { useDetailPanel } from "../features/aggregator-jobs/hooks/useDetailPanel";
import { useSavedJobsLocal } from "../features/aggregator-jobs/hooks/useSavedJobsLocal";
import type { CategoryCounts, LocationCounts } from "../features/aggregator-jobs/types";
import {
  getJobPageSlug,
  getJobTypeGroup,
  hasListedSalary,
  interleaveBySource,
  isExpired,
  normalizeCategory,
  safeText,
} from "../features/aggregator-jobs/utils";
import { applyPageMeta } from "../lib/seo";
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
    activeJobType,
    salaryOnly,
    activeSort,
    setActiveJobType,
    setSalaryOnly,
    setActiveSort,
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

  // The busiest locations, repeated at the top of the dropdown.
  const popularLocations = useMemo(
    () =>
      Object.entries(locationCounts)
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 5)
        .map(([location]) => location),
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

    if (activeJobType) {
      list = list.filter((job) => getJobTypeGroup(job.job_type) === activeJobType);
    }

    if (salaryOnly) {
      list = list.filter((job) => hasListedSalary(job.salary));
    }

    list = list.filter((job) => !isExpired(job.deadline));

    if (activeSort === "newest") {
      return [...list].sort((left, right) => safeText(right.date_posted).localeCompare(safeText(left.date_posted)));
    }

    if (activeSort === "closing") {
      // Listings without a deadline go last, newest first among themselves.
      return [...list].sort((left, right) => {
        const leftDeadline = safeText(left.deadline);
        const rightDeadline = safeText(right.deadline);
        if (leftDeadline && rightDeadline) {
          return leftDeadline.localeCompare(rightDeadline);
        }
        if (leftDeadline || rightDeadline) {
          return leftDeadline ? -1 : 1;
        }
        return safeText(right.date_posted).localeCompare(safeText(left.date_posted));
      });
    }

    // Direct Apply jobs lead the interleave order so they surface on page 1.
    const directJobs = list.filter((job) => isDirectJob(job));
    const externalJobs = list.filter((job) => !isDirectJob(job));
    return interleaveBySource([...directJobs, ...externalJobs]);
  }, [activeCategory, activeLocation, sourceJobs, keywordQuery, savedOnly, isSaved, activeJobType, salaryOnly, activeSort]);

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

  const resultsHeadingText = buildResultsHeadingText({
    count: filteredJobs.length,
    category: activeCategory,
    location: activeLocation,
    keyword: keywordQuery,
    source: activeSource,
    savedOnly,
  });

  const resultsMetaParts = useMemo(() => {
    if (isLoading) {
      return [];
    }

    const latest = jobs
      .map((job) => safeText(job.date_posted))
      .filter((date) => date.length > 0)
      .sort()
      .pop();
    const oldestShown = filteredJobs
      .map((job) => safeText(job.date_posted))
      .filter((date) => date.length > 0)
      .sort()[0];

    return [buildUpdatedText(latest), buildPostedRangeText(oldestShown)].filter(
      (part): part is string => Boolean(part),
    );
  }, [filteredJobs, isLoading, jobs]);

  // Set when the active specialty/location pair has its own landing page.
  const landingMeta = useMemo(() => {
    const count = isLoading ? undefined : (categoryCounts[activeCategory] ?? 0);
    return getLandingMeta(activeCategory, activeLocation, count);
  }, [activeCategory, activeLocation, categoryCounts, isLoading]);

  useEffect(() => {
    if (panelJob && !panelJob._slug.startsWith("direct-")) {
      const company = safeText(panelJob.company);
      const place = safeText(panelJob.location);
      const role = panelJob.job_title || "Healthcare job";
      applyPageMeta({
        title: `${role}${company ? ` at ${company}` : ""}${place ? `, ${place}` : ""} | JobberMed`,
        description: `${role}${company ? ` at ${company}` : ""}${place ? ` in ${place}` : ""}. See requirements, responsibilities and how to apply on JobberMed.`,
        path: `/jobs/${getJobPageSlug(panelJob._slug)}`,
      });
      return;
    }

    if (landingMeta) {
      applyPageMeta({ title: landingMeta.title, description: landingMeta.description, path: landingMeta.path });
      return;
    }

    applyPageMeta({ path: "/" });
  }, [landingMeta, panelJob]);

  const panelIsSaved = panelJob ? isSaved(panelJob._id, panelJob._slug) : false;

  const hasKeyword = keywordQuery.trim().length > 0;

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showResults = useCallback(() => {
    // Close the mobile keyboard, then bring the results into view so the
    // user can see the search did something.
    searchInputRef.current?.blur();
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const heroSearch = (
    <>
      <form
        className="hero-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          showResults();
        }}
      >
        <svg className="hero-search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={searchInputRef}
          id="keywordSearch"
          className={`hero-search-input${hasKeyword ? " has-keyword" : ""}`}
          type="search"
          enterKeyHint="search"
          placeholder="Search roles or hospitals"
          aria-label="Search jobs by keyword"
          value={keywordQuery}
          onChange={(event) => setKeywordQuery(event.target.value)}
        />
        <div className="hero-search-actions">
          {hasKeyword ? (
            <button className="hero-search-clear" type="button" aria-label="Clear search" onClick={clearKeyword}>
              ×
            </button>
          ) : null}
          <button className="hero-search-submit" type="submit">
            Search
          </button>
        </div>
      </form>
      {hasKeyword && !isLoading ? (
        <button className="hero-search-hint" type="button" onClick={showResults} aria-live="polite">
          <strong>{filteredJobs.length}</strong> {filteredJobs.length === 1 ? "job matches" : "jobs match"} “{keywordQuery}”
          <span aria-hidden="true"> · See results ↓</span>
        </button>
      ) : null}
    </>
  );

  // "Others" is a catch-all holding several specialties, so when it's present
  // the true count is at least one more than the number of groups: show "N+".
  const specialtyLabel = useMemo(() => {
    const groups = new Set(allActiveJobs.map((job) => normalizeCategory(job)));
    return groups.has("Others") ? `${groups.size + 1}+` : String(groups.size);
  }, [allActiveJobs]);
  const boardCount = useMemo(
    () => new Set(allActiveJobs.filter((job) => !isDirectJob(job)).map((job) => job._source).filter(Boolean)).size,
    [allActiveJobs],
  );

  const heroEyebrow = (
    <p className="hero-eyebrow">
      <span className="hero-live-dot" aria-hidden="true" />
      {isLoading ? "Loading live roles" : `${sourceCounts.all} live roles, updated daily`}
    </p>
  );

  const heroStats = isLoading ? null : (
    <ul className="hero-stats">
      <li>
        <strong>{sourceCounts.all}</strong> live roles
      </li>
      <li>
        <strong>{specialtyLabel}</strong> specialties
      </li>
      <li>
        <strong>{boardCount}</strong> job boards
      </li>
    </ul>
  );

  return (
    <div className="aggregator-home">
      <HomeLegacyShell
        heroSearch={heroSearch}
        heroEyebrow={heroEyebrow}
        heroStats={heroStats}
        heroTitle={landingMeta ? `${landingMeta.heading}.` : undefined}
        heroSubtitle={landingMeta?.intro}
      >

        <AggregatorFilters
          activeSource={activeSource}
          sourceCounts={sourceCounts}
          onSourceChange={setActiveSource}
          categoryOrder={CATEGORY_ORDER}
          categoryCounts={categoryCounts}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          isLoading={isLoading}
          locationOptions={locationOptions}
          popularLocations={popularLocations}
          activeJobType={activeJobType}
          onJobTypeChange={setActiveJobType}
          salaryOnly={salaryOnly}
          onToggleSalary={() => setSalaryOnly(!salaryOnly)}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          locationCounts={locationCounts}
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          savedOnly={savedOnly}
          savedCount={savedCount}
          onToggleSaved={() => setSavedOnly(!savedOnly)}
          keywordQuery={keywordQuery}
          onClearKeyword={clearKeyword}
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearAllFilters}
        />

        <AggregatorStats
          isLoading={isLoading}
          jobCountLabel={jobCountLabel}
          headingText={resultsHeadingText}
          metaParts={resultsMetaParts}
        />

        {directJobsError ? <p className="aggregator-source-notice">{directJobsError}</p> : null}

        {error ? (
          <main className="grid" id="grid">
            <p className="aggregator-load-error">Could not load jobs data. Please try again later.</p>
          </main>
        ) : null}

        {!error && isLoading ? (
          <main className="grid" id="grid" aria-busy="true">
            <span className="sr-only">Loading jobs</span>
            {Array.from({ length: 6 }, (_, index) => (
              <div className="card job-card job-card-skeleton" key={index} aria-hidden="true">
                <div className="skeleton-row">
                  <span className="skeleton skeleton-avatar" />
                  <span className="skeleton skeleton-line" style={{ width: "55%" }} />
                </div>
                <span className="skeleton skeleton-line skeleton-title" style={{ width: "70%" }} />
                <span className="skeleton skeleton-line" style={{ width: "40%" }} />
                <span className="skeleton skeleton-line" style={{ width: "100%", height: 34 }} />
              </div>
            ))}
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
              directOnly={activeSource === "direct"}
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

      <FooterShell>
        {!error && !isLoading ? (
          <LandingBrowseLinks
            activeCategory={activeCategory}
            activeLocation={activeLocation}
            categoryCounts={categoryCounts}
            locationCounts={locationCounts}
          />
        ) : null}
      </FooterShell>
      <AggregatorScrollTopButton />
    </div>
  );
}
