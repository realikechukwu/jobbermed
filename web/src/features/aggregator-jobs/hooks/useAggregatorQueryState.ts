import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ALL_CATEGORY, ALL_LOCATIONS } from "../constants";
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

  const activeCategory = useMemo(() => safeText(searchParams.get("category")) || ALL_CATEGORY, [searchParams]);
  const activeLocation = useMemo(() => safeText(searchParams.get("loc")) || ALL_LOCATIONS, [searchParams]);
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

  const setActiveCategory = useCallback(
    (category: string) => {
      const normalizedCategory = safeText(category) || ALL_CATEGORY;
      updateFilterParams((params) => {
        if (normalizedCategory === ALL_CATEGORY) {
          params.delete("category");
        } else {
          params.set("category", normalizedCategory);
        }
      });
    },
    [updateFilterParams],
  );

  const setActiveLocation = useCallback(
    (location: string) => {
      const normalizedLocation = safeText(location) || ALL_LOCATIONS;
      updateFilterParams((params) => {
        if (normalizedLocation === ALL_LOCATIONS) {
          params.delete("loc");
        } else {
          params.set("loc", normalizedLocation);
        }
      });
    },
    [updateFilterParams],
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
    updateParams((params) => {
      ["category", "loc", "q", "saved", "source", "page"].forEach((key) => params.delete(key));
    });
  }, [updateParams]);

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
