import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ALL_CATEGORY, ALL_LOCATIONS } from "../constants";
import { buildLandingPath, parseLandingPath } from "../landing";
import { safeText } from "../utils";

type ParamMutator = (params: URLSearchParams) => void;

export type JobSourceFilter = "all" | "direct" | "external";

type AggregatorQueryState = {
  activeCategory: string;
  activeLocation: string;
  keywordQuery: string;
  savedOnly: boolean;
  currentPage: number;
  activeSource: JobSourceFilter;
  setActiveCategory: (category: string) => void;
  setActiveLocation: (location: string) => void;
  setKeywordQuery: (keyword: string) => void;
  clearKeyword: () => void;
  setSavedOnly: (nextSavedOnly: boolean) => void;
  setCurrentPage: (nextPage: number) => void;
  setActiveSource: (source: JobSourceFilter) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
};

function parseSource(value: string): JobSourceFilter {
  if (value === "direct" || value === "external") {
    return value;
  }
  return "all";
}

function parsePage(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function useAggregatorQueryState(): AggregatorQueryState {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // On a landing page (/doctor-jobs/lagos) the path carries the specialty and
  // location; elsewhere they come from ?category= and ?loc=.
  const landing = useMemo(() => parseLandingPath(pathname), [pathname]);

  const activeCategory = useMemo(
    () => (landing ? landing.category : safeText(searchParams.get("category")) || ALL_CATEGORY),
    [landing, searchParams],
  );
  const activeLocation = useMemo(
    () => (landing ? landing.location : safeText(searchParams.get("loc")) || ALL_LOCATIONS),
    [landing, searchParams],
  );
  const keywordQuery = useMemo(() => safeText(searchParams.get("q")).toLowerCase(), [searchParams]);
  const savedOnly = useMemo(() => searchParams.get("saved") === "1", [searchParams]);
  const currentPage = useMemo(() => parsePage(safeText(searchParams.get("page"))), [searchParams]);
  const activeSource = useMemo(() => parseSource(safeText(searchParams.get("source"))), [searchParams]);

  const updateParams = useCallback(
    (mutator: ParamMutator) => {
      const next = new URLSearchParams(searchParams);
      mutator(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Filter changes reset pagination inside the same params update so a single
  // history entry carries both changes.
  const updateFilterParams = useCallback(
    (mutator: ParamMutator) => {
      updateParams((params) => {
        mutator(params);
        params.delete("page");
      });
    },
    [updateParams],
  );

  // Specialty and location live in the path whenever the pair has a landing
  // page, so a filtered feed always has one clean, shareable URL.
  const setCategoryAndLocation = useCallback(
    (category: string, location: string) => {
      const params = new URLSearchParams(searchParams);
      ["category", "loc", "page"].forEach((key) => params.delete(key));

      let nextPath = buildLandingPath(category, location);
      if (nextPath === null) {
        nextPath = "/";
        if (category !== ALL_CATEGORY) {
          params.set("category", category);
        }
        if (location !== ALL_LOCATIONS) {
          params.set("loc", location);
        }
      }

      const search = params.toString();
      navigate({ pathname: nextPath, search: search ? `?${search}` : "" }, { replace: true });
    },
    [navigate, searchParams],
  );

  const setActiveCategory = useCallback(
    (category: string) => {
      setCategoryAndLocation(safeText(category) || ALL_CATEGORY, activeLocation);
    },
    [activeLocation, setCategoryAndLocation],
  );

  const setActiveLocation = useCallback(
    (location: string) => {
      setCategoryAndLocation(activeCategory, safeText(location) || ALL_LOCATIONS);
    },
    [activeCategory, setCategoryAndLocation],
  );

  const setKeywordQuery = useCallback(
    (keyword: string) => {
      const normalizedKeyword = safeText(keyword).toLowerCase();
      updateFilterParams((params) => {
        if (!normalizedKeyword) {
          params.delete("q");
        } else {
          params.set("q", normalizedKeyword);
        }
      });
    },
    [updateFilterParams],
  );

  const clearKeyword = useCallback(() => {
    setKeywordQuery("");
  }, [setKeywordQuery]);

  const setSavedOnly = useCallback(
    (nextSavedOnly: boolean) => {
      updateFilterParams((params) => {
        if (nextSavedOnly) {
          params.set("saved", "1");
        } else {
          params.delete("saved");
        }
      });
    },
    [updateFilterParams],
  );

  const setActiveSource = useCallback(
    (source: JobSourceFilter) => {
      updateFilterParams((params) => {
        if (source === "all") {
          params.delete("source");
        } else {
          params.set("source", source);
        }
      });
    },
    [updateFilterParams],
  );

  const setCurrentPage = useCallback(
    (nextPage: number) => {
      if (!Number.isFinite(nextPage)) {
        return;
      }

      const normalizedPage = Math.max(1, Math.floor(nextPage));
      updateParams((params) => {
        if (normalizedPage === 1) {
          params.delete("page");
        } else {
          params.set("page", String(normalizedPage));
        }
      });
    },
    [updateParams],
  );

  const hasActiveFilters =
    activeCategory !== ALL_CATEGORY ||
    activeLocation !== ALL_LOCATIONS ||
    keywordQuery.length > 0 ||
    savedOnly ||
    activeSource !== "all";

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    ["category", "loc", "q", "saved", "source", "page"].forEach((key) => params.delete(key));
    const search = params.toString();
    navigate({ pathname: landing ? "/" : pathname, search: search ? `?${search}` : "" }, { replace: true });
  }, [landing, navigate, pathname, searchParams]);

  return {
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
  };
}
