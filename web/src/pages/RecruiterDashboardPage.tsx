import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyNativeJobs } from "../features/native-jobs/api";
import type { NativeJob } from "../features/native-jobs/types";
import { RouteShell } from "../layouts/RouteShell";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatStatus(value: string): string {
  const words = String(value || "").replace(/_/g, " ").trim();
  return words ? `${words[0].toUpperCase()}${words.slice(1)}` : "-";
}

export function RecruiterDashboardPage() {
  const [jobs, setJobs] = useState<NativeJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      setIsLoading(true);
      setError(null);

      try {
        const myJobs = await fetchMyNativeJobs();
        if (!isMounted) return;
        setJobs(myJobs);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load recruiter jobs.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const jobCountText = jobs.length === 1 ? "1 job posted" : `${jobs.length} jobs posted`;

  return (
    <RouteShell title="Recruiter dashboard" subtitle="Post jobs and review the people who apply.">
      <section className="shell-content" aria-label="Recruiter jobs list">
        <article className="card">
          <div className="dashboard-card-head">
            <div>
              <h2 className="title">My jobs</h2>
              <p className="meta">{isLoading ? "Loading..." : jobs.length === 0 ? "No jobs yet." : `${jobCountText}, newest first.`}</p>
            </div>
            <Link className="shell-button dashboard-link dashboard-link-primary" to="/recruiter/jobs/new">
              Post a job
            </Link>
          </div>

          {error ? <p className="native-form-message native-form-error">{error}</p> : null}

          {!isLoading && !error && jobs.length === 0 ? (
            <p className="meta">
              You have not posted a job yet. Once you do, it appears here with a link to its applicants.
            </p>
          ) : null}

          {!isLoading && !error && jobs.length > 0 ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Applicants</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.title}</td>
                      <td>{formatStatus(job.status)}</td>
                      <td>{formatDate(job.createdAt)}</td>
                      <td>
                        <Link
                          className="access-inline-link"
                          to={`/recruiter/jobs/${job.id}/applicants`}
                          aria-label={`View applicants for ${job.title}`}
                        >
                          View applicants
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </section>
    </RouteShell>
  );
}
