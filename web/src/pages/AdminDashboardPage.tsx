import { useEffect, useState } from "react";
import { CardPrimitive } from "../components/CardPrimitive";
import {
  fetchPendingAccessRequestsForAdmin,
  reviewAccessRequest,
  type AccessRequestWithProfile,
} from "../features/access-requests/api";
import { RouteShell } from "../layouts/RouteShell";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatRole(value: string): string {
  if (value === "mdcn_official") return "MDCN official";
  if (value === "recruiter") return "Recruiter";
  if (value === "admin") return "Admin";
  return value;
}

export function AdminDashboardPage() {
  const [requests, setRequests] = useState<AccessRequestWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRequests() {
      setIsLoading(true);
      setError(null);

      try {
        const pendingRequests = await fetchPendingAccessRequestsForAdmin();
        if (!isMounted) return;
        setRequests(pendingRequests);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load pending access requests.";
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleReview(requestId: string, approve: boolean) {
    setError(null);
    setNotice(null);
    setActioningId(requestId);

    try {
      const reviewed = await reviewAccessRequest(requestId, approve);
      setRequests((current) => current.filter((request) => request.id !== requestId));
      setNotice(
        `${formatRole(reviewed.requestedRole)} request ${approve ? "approved" : "rejected"} for ${
          reviewed.userId
        }.`,
      );
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : "Unable to review access request.";
      setError(message);
    } finally {
      setActioningId(null);
    }
  }

  return (
    <RouteShell title="Admin dashboard" subtitle="Approve or reject recruiter and MDCN role access requests.">
      <section className="shell-grid" aria-label="Admin summary cards">
        <CardPrimitive title="Pending approvals" meta="Access requests awaiting admin review.">
          <p className="meta">{isLoading ? "Loading..." : `${requests.length} pending`}</p>
        </CardPrimitive>

        <CardPrimitive title="Role operations" meta="Approvals grant active platform roles.">
          <p className="meta">Approvals call `approve_access_request()` and activate role assignments.</p>
        </CardPrimitive>
      </section>

      <section className="shell-content" aria-label="Pending access requests">
        <CardPrimitive title="Access request queue" meta="Oldest pending requests first.">
          {isLoading ? <p className="meta">Loading pending requests...</p> : null}
          {error ? <p className="native-form-message native-form-error">{error}</p> : null}
          {notice ? <p className="native-form-message native-form-success">{notice}</p> : null}

          {!isLoading && !error && requests.length === 0 ? (
            <p className="meta">No pending access requests.</p>
          ) : null}

          {!isLoading && !error && requests.length > 0 ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Requested role</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Reason</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{formatRole(request.requestedRole)}</td>
                      <td>{request.requesterName || request.userId}</td>
                      <td>{request.requesterEmail || "-"}</td>
                      <td>{request.reason || "-"}</td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td>
                        <div className="dashboard-action-row">
                          <button
                            className="shell-button dashboard-inline-button"
                            type="button"
                            disabled={actioningId === request.id}
                            onClick={() => void handleReview(request.id, true)}
                          >
                            {actioningId === request.id ? "Working..." : "Approve"}
                          </button>
                          <button
                            className="shell-button dashboard-inline-button dashboard-inline-button-alt"
                            type="button"
                            disabled={actioningId === request.id}
                            onClick={() => void handleReview(request.id, false)}
                          >
                            Reject
                          </button>
                        </div>
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
