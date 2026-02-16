import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ALL_CATEGORY, ALL_LOCATIONS } from "../constants";
import { safeText } from "../utils";

type ParamMutator = (params: URLSearchParams) => void;

type AggregatorQueryState = {
  activeCategory: string;
  activeLocation: string;
  keywordQuery: string;
  savedOnly: boolean;
  currentPage: number;
  setActiveCategory: (category: string) => void;
  setActiveLocation: (location: string) => void;
  setKeywordQuery: (keyword: string) => void;
  clearKeyword: () => void;
  setSavedOnly: (nextSavedOnly: boolean) => void;
  setCurrentPage: (nextPage: number) => void;
};

export function useAggregatorQueryState(): AggregatorQueryState {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeLocation, setActiveLocation] = useState(ALL_LOCATIONS);
  const [currentPage, setCurrentPageState] = useState(1);

  const activeCategory = useMemo(() => safeText(searchParams.get("category")) || ALL_CATEGORY, [searchParams]);
  const keywordQuery = useMemo(() => safeText(searchParams.get("q")).toLowerCase(), [searchParams]);
  const savedOnly = useMemo(() => searchParams.get("saved") === "1", [searchParams]);

  const updateParams = useCallback(
    (mutator: ParamMutator) => {
      const next = new URLSearchParams(searchParams);
      mutator(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setActiveCategory = useCallback(
    (category: string) => {
      const normalizedCategory = safeText(category) || ALL_CATEGORY;
      updateParams((params) => {
        if (normalizedCategory === ALL_CATEGORY) {
          params.delete("category");
        } else {
          params.set("category", normalizedCategory);
        }
      });
    },
    [updateParams],
  );

  const setKeywordQuery = useCallback(
    (keyword: string) => {
      const normalizedKeyword = safeText(keyword).toLowerCase();
      updateParams((params) => {
        if (!normalizedKeyword) {
          params.delete("q");
        } else {
          params.set("q", normalizedKeyword);
        }
      });
    },
    [updateParams],
  );

  const clearKeyword = useCallback(() => {
    setKeywordQuery("");
  }, [setKeywordQuery]);

  const setSavedOnly = useCallback(
    (nextSavedOnly: boolean) => {
      updateParams((params) => {
        if (nextSavedOnly) {
          params.set("saved", "1");
        } else {
          params.delete("saved");
        }
      });
    },
    [updateParams],
  );

  const setCurrentPage = useCallback((nextPage: number) => {
    if (!Number.isFinite(nextPage)) {
      return;
    }

    const normalizedPage = Math.max(1, Math.floor(nextPage));
    setCurrentPageState(normalizedPage);
  }, []);

  useEffect(() => {
    setCurrentPageState(1);
  }, [activeCategory, activeLocation, keywordQuery, savedOnly]);

  return {
    activeCategory,
    activeLocation,
    keywordQuery,
    savedOnly,
    currentPage,
    setActiveCategory,
    setActiveLocation,
    setKeywordQuery,
    clearKeyword,
    setSavedOnly,
    setCurrentPage,
  };
}
