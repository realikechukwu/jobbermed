import { useEffect, useState } from "react";
import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

const AGGREGATED_JOBS_URL = `${import.meta.env.BASE_URL}data/master_jobs.json`;

type AggregatedJobsPayload = {
  jobs?: unknown;
};

function getAggregatedJobsCount(payload: unknown): number {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  if (payload && typeof payload === "object") {
    const wrapped = payload as AggregatedJobsPayload;
    if (Array.isArray(wrapped.jobs)) {
      return wrapped.jobs.length;
    }
  }

  return 0;
}

export function HomePage() {
  const [jobsCount, setJobsCount] = useState<number | null>(null);
  const [jobsLoadError, setJobsLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function loadAggregatedJobs() {
      try {
        const response = await fetch(AGGREGATED_JOBS_URL);
        if (!response.ok) {
          throw new Error(`Unable to load aggregated jobs (${response.status}).`);
        }

        const payload = (await response.json()) as unknown;
        if (!isSubscribed) return;
        setJobsCount(getAggregatedJobsCount(payload));
        setJobsLoadError(null);
      } catch (error) {
        if (!isSubscribed) return;
        const message = error instanceof Error ? error.message : "Unable to load aggregated jobs.";
        setJobsLoadError(message);
        setJobsCount(null);
      }
    }

    void loadAggregatedJobs();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const liveJobsMessage = jobsLoadError
    ? "Unable to load aggregated jobs right now."
    : jobsCount === null
      ? "Loading aggregated jobs..."
      : `${jobsCount} aggregated jobs available from latest pipeline output.`;

  return (
    <RouteShell
      title="Healthcare jobs across Nigeria and Africa."
      subtitle="Delivered to your email every week."
    >
      <section className="shell-grid" aria-label="Home overview cards">
        <CardPrimitive title="Live jobs" meta="Route shell only">
          <p className="meta">{liveJobsMessage}</p>
        </CardPrimitive>
        <CardPrimitive title="Weekly updates" meta="Route shell only">
          <p className="meta">Personalized delivery settings are available in Dashboard preferences.</p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
