import { useEffect, useState } from "react";
import { extractRawJobs, normalizeJobs } from "../aggregator-jobs/utils";
import { fetchPublishedNativeJobs } from "../native-jobs/api";
import { aggregatorJobToUnified, nativeJobToUnified, type UnifiedJob } from "./unify";

type UnifiedJobsDataState = {
  jobs: UnifiedJob[];
  isLoading: boolean;
  error: string | null;
  directJobsError: string | null;
};

const INITIAL_STATE: UnifiedJobsDataState = {
  jobs: [],
  isLoading: true,
  error: null,
  directJobsError: null,
};

async function loadAggregatedJobs(dataUrl: string): Promise<UnifiedJob[]> {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Unable to load aggregated jobs (${response.status}).`);
  }

  const payload = (await response.json()) as unknown;
  return normalizeJobs(extractRawJobs(payload)).map(aggregatorJobToUnified);
}

async function loadDirectJobs(): Promise<UnifiedJob[]> {
  const nativeJobs = await fetchPublishedNativeJobs();
  return nativeJobs.map(nativeJobToUnified);
}

export function useUnifiedJobsData(dataUrl: string): UnifiedJobsDataState {
  const [state, setState] = useState<UnifiedJobsDataState>(INITIAL_STATE);

  useEffect(() => {
    let isSubscribed = true;

    async function loadJobs() {
      setState(INITIAL_STATE);

      const [aggregatedResult, directResult] = await Promise.allSettled([
        loadAggregatedJobs(dataUrl),
        loadDirectJobs(),
      ]);

      if (!isSubscribed) {
        return;
      }

      const aggregatedJobs = aggregatedResult.status === "fulfilled" ? aggregatedResult.value : [];
      const directJobs = directResult.status === "fulfilled" ? directResult.value : [];

      // One source failing degrades to the other; only both failing is fatal.
      if (aggregatedResult.status === "rejected" && directResult.status === "rejected") {
        const message =
          aggregatedResult.reason instanceof Error
            ? aggregatedResult.reason.message
            : "Unable to load jobs.";
        setState({ jobs: [], isLoading: false, error: message, directJobsError: null });
        return;
      }

      const directJobsError =
        directResult.status === "rejected"
          ? "Direct Apply jobs are temporarily unavailable. Showing external listings only."
          : null;

      const aggregatedError =
        aggregatedResult.status === "rejected"
          ? "External listings are temporarily unavailable. Showing Direct Apply jobs only."
          : null;

      // Merge, newest first, matching the sort normalizeJobs applies.
      const jobs = [...directJobs, ...aggregatedJobs].sort((left, right) =>
        (right.date_posted || "").localeCompare(left.date_posted || ""),
      );

      setState({
        jobs,
        isLoading: false,
        error: null,
        directJobsError: directJobsError ?? aggregatedError,
      });
    }

    void loadJobs();

    return () => {
      isSubscribed = false;
    };
  }, [dataUrl]);

  return state;
}
