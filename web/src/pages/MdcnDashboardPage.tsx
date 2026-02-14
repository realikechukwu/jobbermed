import { useEffect, useState } from "react";
import { CardPrimitive } from "../components/CardPrimitive";
import {
  fetchReviewerNativeApplications,
  updateNativeApplicationStatus,
} from "../features/native-jobs/api";
import type { NativeApplicationStatus, NativeJobApplicationRecord } from "../features/native-jobs/types";
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

export function MdcnDashboardPage() {
  const [applications, setApplications] = useState<NativeJobApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, NativeApplicationStatus>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadQueue() {
      setIsLoading(true);
      setError(null);

      try {
        const queue = await fetchReviewerNativeApplications();
        if (!isMounted) return;
        setApplications(queue);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load MDCN review queue.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveStatus(applicationId: string) {
    const nextStatus = pendingStatuses[applicationId];
    if (!nextStatus) {
      return;
    }

    setUpdatingId(applicationId);
    setError(null);

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
      const message = updateError instanceof Error ? updateError.message : "Unable to update application status.";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <RouteShell title="MDCN dashboard" subtitle="Regulatory review queue for native job applications.">
      <section className="shell-grid" aria-label="MDCN summary cards">
        <CardPrimitive title="Review queue" meta="All applications visible to MDCN reviewers.">
          <p className="meta">{isLoading ? "Loading..." : `${applications.length} applications`}</p>
        </CardPrimitive>

        <CardPrimitive title="Workflow" meta="Update statuses as regulatory review progresses.">
          <p className="meta">Status changes are persisted immediately to the native applications table.</p>
        </CardPrimitive>
      </section>

      <section className="shell-content" aria-label="MDCN applications queue">
        <CardPrimitive title="Applications queue" meta="Newest submissions first.">
          {isLoading ? <p className="meta">Loading queue...</p> : null}
          {error ? <p className="native-form-message native-form-error">{error}</p> : null}

          {!isLoading && !error && applications.length === 0 ? (
            <p className="meta">No applications available for review.</p>
          ) : null}

          {!isLoading && !error && applications.length > 0 ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Job</th>
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
                        <td>{application.jobTitle || "Untitled role"}</td>
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
