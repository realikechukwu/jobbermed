import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { fetchMyNativeJobs } from "../features/native-jobs/api";
import type { NativeJob } from "../features/native-jobs/types";
import { RouteShell } from "../layouts/RouteShell";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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

  return (
    <RouteShell title="Recruiter dashboard" subtitle="Create native jobs and manage incoming applicants.">
      <section className="shell-grid" aria-label="Recruiter summary cards">
        <CardPrimitive title="Native jobs" meta="Jobs posted by your account.">
          <p className="meta">{isLoading ? "Loading..." : `${jobs.length} total jobs`}</p>
          <Link className="shell-button dashboard-link" to="/recruiter/jobs/new">
            Post new native job
          </Link>
        </CardPrimitive>

        <CardPrimitive title="Review applications" meta="Open applicants by job.">
          <p className="meta">Each job has a dedicated applicant workflow.</p>
          <Link className="shell-button dashboard-link" to="/native-jobs">
            View public native jobs
          </Link>
        </CardPrimitive>
      </section>

      <section className="shell-content" aria-label="Recruiter jobs list">
        <CardPrimitive title="My jobs" meta="Newest first.">
          {isLoading ? <p className="meta">Loading jobs...</p> : null}
          {error ? <p className="native-form-message native-form-error">{error}</p> : null}

          {!isLoading && !error && jobs.length === 0 ? (
            <p className="meta">No jobs posted yet.</p>
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
                      <td>{job.status}</td>
                      <td>{formatDate(job.createdAt)}</td>
                      <td>
                        <Link className="access-inline-link" to={`/recruiter/jobs/${job.id}/applicants`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
