import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import {
  fetchNativeJobApplicants,
  fetchNativeJobByIdForManager,
  updateNativeApplicationStatus,
} from "../features/native-jobs/api";
import type { NativeApplicationStatus, NativeJob, NativeJobApplicationRecord } from "../features/native-jobs/types";
import { RouteShell } from "../layouts/RouteShell";

const STATUS_OPTIONS: NativeApplicationStatus[] = [
  "submitted",
  "in_review",
  "shortlisted",
  "rejected",
  "hired",
  "withdrawn",
];

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function normalizeStatus(value: string): NativeApplicationStatus {
  if (STATUS_OPTIONS.includes(value as NativeApplicationStatus)) {
    return value as NativeApplicationStatus;
  }
  return "submitted";
}

export function RecruiterJobApplicantsPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<NativeJob | null>(null);
  const [applications, setApplications] = useState<NativeJobApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, NativeApplicationStatus>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      if (!jobId) {
        setError("Missing job id.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [jobData, applicantData] = await Promise.all([
          fetchNativeJobByIdForManager(jobId),
          fetchNativeJobApplicants(jobId),
        ]);

        if (!isMounted) return;

        if (!jobData) {
          setError("Job not found or not accessible.");
          setJob(null);
          setApplications([]);
          return;
        }

        setJob(jobData);
        setApplications(applicantData);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load job applicants.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const submittedCount = useMemo(
    () => applications.filter((application) => normalizeStatus(String(application.status)) === "submitted").length,
    [applications],
  );

  async function handleSaveStatus(applicationId: string) {
    const nextStatus = pendingStatuses[applicationId];
    if (!nextStatus) {
      return;
    }

    setError(null);
    setUpdatingId(applicationId);

    try {
      await updateNativeApplicationStatus(applicationId, nextStatus);

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? { ...application, status: nextStatus } : application,
        ),
      );

      setPendingStatuses((current) => {
        const copy = { ...current };
        delete copy[applicationId];
        return copy;
      });
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Unable to update status.";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <RouteShell
      title={job ? `Applicants: ${job.title}` : "Recruiter applicants"}
      subtitle="Review candidate submissions and update application statuses."
    >
      <section className="shell-grid" aria-label="Applicants summary">
        <CardPrimitive title="Applications" meta="Total candidates for this job.">
          <p className="meta">{isLoading ? "Loading..." : `${applications.length} total`}</p>
        </CardPrimitive>

        <CardPrimitive title="Submitted" meta="Candidates awaiting initial review.">
          <p className="meta">{isLoading ? "Loading..." : `${submittedCount} submitted`}</p>
          <Link className="access-inline-link" to="/recruiter">
            Back to recruiter dashboard
          </Link>
        </CardPrimitive>
      </section>

      <section className="shell-content" aria-label="Applicants table">
        <CardPrimitive title="Applicant queue" meta="Update statuses directly in this table.">
          {isLoading ? <p className="meta">Loading applicants...</p> : null}
          {error ? <p className="native-form-message native-form-error">{error}</p> : null}

          {!isLoading && !error && applications.length === 0 ? (
            <p className="meta">No applications submitted for this job yet.</p>
          ) : null}

          {!isLoading && !error && applications.length > 0 ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Email</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => {
                    const currentStatus = normalizeStatus(String(application.status));
                    const selectedStatus = pendingStatuses[application.id] ?? currentStatus;
                    const isDirty = selectedStatus !== currentStatus;

                    return (
                      <tr key={application.id}>
                        <td>{application.applicantName || "-"}</td>
                        <td>{application.applicantEmail || "-"}</td>
                        <td>{formatDate(application.submittedAt)}</td>
                        <td>
                          <select
                            className="shell-input dashboard-status-select"
                            value={selectedStatus}
                            onChange={(event) =>
                              setPendingStatuses((current) => ({
                                ...current,
                                [application.id]: event.target.value as NativeApplicationStatus,
                              }))
                            }
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="shell-button dashboard-inline-button"
                            type="button"
                            disabled={!isDirty || updatingId === application.id}
                            onClick={() => void handleSaveStatus(application.id)}
                          >
                            {updatingId === application.id ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
