import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import type { AggregatorJob } from "../types";
import { findJobBySlug, getJobSlug, safeText } from "../utils";

type UseDetailPanelArgs = {
  jobs: AggregatorJob[];
};

type UseDetailPanelResult = {
  panelJob: AggregatorJob | null;
  isMounted: boolean;
  isClosing: boolean;
  overlayVisible: boolean;
  openDetail: (job: AggregatorJob) => void;
  closeDetail: () => void;
};

const CLOSE_ANIMATION_MS = 450;

export function useDetailPanel({ jobs }: UseDetailPanelArgs): UseDetailPanelResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const [panelSlug, setPanelSlug] = useState<string | null>(() => safeText(searchParams.get("job")) || null);
  const [isClosing, setIsClosing] = useState(false);

  const closeTimerRef = useRef<number | null>(null);

  const jobSlugParam = safeText(searchParams.get("job"));
  const isMounted = panelSlug !== null;

  useBodyScrollLock(isMounted);

  useEffect(() => {
    if (!isMounted) {
      document.body.classList.remove("panel-open");
      return;
    }

    document.body.classList.add("panel-open");
    return () => {
      document.body.classList.remove("panel-open");
    };
  }, [isMounted]);

  useEffect(() => {
    if (jobSlugParam) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      setPanelSlug(jobSlugParam);
      setIsClosing(false);
      return;
    }

    if (!panelSlug) {
      return;
    }

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setPanelSlug(null);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, CLOSE_ANIMATION_MS);
  }, [jobSlugParam, panelSlug]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const openDetail = useCallback(
    (job: AggregatorJob) => {
      const slug = getJobSlug(job);
      const next = new URLSearchParams(searchParams);
      next.set("job", slug);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const closeDetail = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("job");
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!panelSlug) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDetail();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [panelSlug, closeDetail]);

  const panelJob = useMemo(() => findJobBySlug(jobs, panelSlug), [jobs, panelSlug]);

  return {
    panelJob,
    isMounted,
    isClosing,
    overlayVisible: isMounted,
    openDetail,
    closeDetail,
  };
}
