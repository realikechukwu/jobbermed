import { useCallback, useEffect, useMemo, useState } from "react";
import type { AggregatorJob } from "../types";

const SAVED_JOBS_STORAGE_KEY = "savedJobs";
const SAVED_JOB_DETAILS_KEY = "savedJobDetails";

function readSavedJobsFromStorage(): Set<string> {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  const raw = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
  if (!raw) {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    const values = parsed
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);

    return new Set(values);
  } catch {
    return new Set<string>();
  }
}

function readSavedJobDetails(): Record<string, { title: string; company: string; location: string }> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(SAVED_JOB_DETAILS_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as Record<string, { title: string; company: string; location: string }>;
  } catch {
    return {};
  }
}

function persistSavedJobs(nextSavedIds: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(Array.from(nextSavedIds)));
}

function persistSavedJobDetails(details: Record<string, { title: string; company: string; location: string }>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SAVED_JOB_DETAILS_KEY, JSON.stringify(details));
}

type UseSavedJobsLocalResult = {
  savedCount: number;
  isSaved: (jobId: string, slugId: string) => boolean;
  toggleSavedJob: (job: AggregatorJob) => void;
};

export function useSavedJobsLocal(): UseSavedJobsLocalResult {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => readSavedJobsFromStorage());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SAVED_JOBS_STORAGE_KEY) {
        setSavedIds(readSavedJobsFromStorage());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const isSaved = useCallback(
    (jobId: string, slugId: string) => {
      return savedIds.has(jobId) || savedIds.has(slugId);
    },
    [savedIds],
  );

  const toggleSavedJob = useCallback(
    (job: AggregatorJob) => {
      setSavedIds((current) => {
        const next = new Set(current);
        const alreadySaved = next.has(job._id) || next.has(job._slug);

        if (alreadySaved) {
          next.delete(job._id);
          next.delete(job._slug);

          const details = readSavedJobDetails();
          delete details[job._id];
          delete details[job._slug];
          persistSavedJobDetails(details);
        } else {
          next.add(job._id);

          const details = readSavedJobDetails();
          details[job._id] = {
            title: job.job_title,
            company: job.company,
            location: job.location,
          };
          persistSavedJobDetails(details);
        }

        persistSavedJobs(next);
        return next;
      });
    },
    [setSavedIds],
  );

  const savedCount = useMemo(() => savedIds.size, [savedIds]);

  return {
    savedCount,
    isSaved,
    toggleSavedJob,
  };
}
