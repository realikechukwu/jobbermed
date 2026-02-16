import { useEffect, useState } from "react";
import type { AggregatorJob } from "../types";
import { extractRawJobs, normalizeJobs } from "../utils";

type AggregatorJobsDataState = {
  jobs: AggregatorJob[];
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: AggregatorJobsDataState = {
  jobs: [],
  isLoading: true,
  error: null,
};

export function useAggregatorJobsData(dataUrl: string): AggregatorJobsDataState {
  const [state, setState] = useState<AggregatorJobsDataState>(INITIAL_STATE);

  useEffect(() => {
    let isSubscribed = true;

    async function loadJobs() {
      setState((current) => ({ ...current, isLoading: true, error: null }));

      try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`Unable to load aggregated jobs (${response.status}).`);
        }

        const payload = (await response.json()) as unknown;
        if (!isSubscribed) {
          return;
        }

        const jobs = normalizeJobs(extractRawJobs(payload));
        setState({ jobs, isLoading: false, error: null });
      } catch (error) {
        if (!isSubscribed) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load aggregated jobs.";
        setState({ jobs: [], isLoading: false, error: message });
      }
    }

    void loadJobs();

    return () => {
      isSubscribed = false;
    };
  }, [dataUrl]);

  return state;
}
