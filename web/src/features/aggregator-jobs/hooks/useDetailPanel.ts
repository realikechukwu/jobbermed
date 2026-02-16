import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const scrollYRef = useRef(0);
  const isBodyLockedRef = useRef(false);

  const jobSlugParam = safeText(searchParams.get("job"));
  const refParam = safeText(searchParams.get("ref"));

  const lockBody = useCallback(() => {
    if (typeof window === "undefined" || isBodyLockedRef.current) {
      return;
    }

    scrollYRef.current = window.scrollY || 0;
    document.body.classList.add("panel-open");
    document.body.style.top = `-${scrollYRef.current}px`;
    isBodyLockedRef.current = true;
  }, []);

  const unlockBody = useCallback(() => {
    if (typeof window === "undefined" || !isBodyLockedRef.current) {
      return;
    }

    document.body.classList.remove("panel-open");
    document.body.style.top = "";
    window.scrollTo(0, scrollYRef.current);
    isBodyLockedRef.current = false;
  }, []);

  useEffect(() => {
    if (refParam === "dashboard") {
      sessionStorage.setItem("returnToDashboard", "1");
    }
  }, [refParam]);

  useEffect(() => {
    if (jobSlugParam) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      setPanelSlug(jobSlugParam);
      setIsClosing(false);
      lockBody();
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
      unlockBody();
    }, CLOSE_ANIMATION_MS);
  }, [jobSlugParam, panelSlug, lockBody, unlockBody]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      unlockBody();
    };
  }, [unlockBody]);

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
    const ref = searchParams.get("ref");
    const shouldReturnToDashboard = sessionStorage.getItem("returnToDashboard") === "1";

    if (ref === "dashboard" || shouldReturnToDashboard) {
      sessionStorage.removeItem("returnToDashboard");
      window.location.assign("/dashboard#saved-jobs");
      return;
    }

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
  const isMounted = panelSlug !== null;

  return {
    panelJob,
    isMounted,
    isClosing,
    overlayVisible: isMounted,
    openDetail,
    closeDetail,
  };
}
