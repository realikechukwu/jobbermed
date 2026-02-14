import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CardPrimitive } from "../../../components/CardPrimitive";
import { RouteShell } from "../../../layouts/RouteShell";
import { useSession } from "../../auth/session-context";
import {
  createAccessRequest,
  fetchMyAccessRequests,
  type AccessRequest,
  type AccessRequestRole,
} from "../api";

type AccessRequestCardProps = {
  requiredRole: AccessRequestRole;
};

const ROLE_LABELS: Record<AccessRequestRole, string> = {
  recruiter: "Recruiter",
  mdcn_official: "MDCN Official",
};

const ROLE_ROUTES: Record<AccessRequestRole, string> = {
  recruiter: "/recruiter",
  mdcn_official: "/mdcn",
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AccessRequestCard({ requiredRole }: AccessRequestCardProps) {
  const navigate = useNavigate();
  const { hasRole, refresh } = useSession();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRequests() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchMyAccessRequests(requiredRole);
        if (!isMounted) return;
        setRequests(data);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load access requests.";
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
  }, [requiredRole]);

  const latestRequest = useMemo(() => requests[0] ?? null, [requests]);

  const resolvedRole = hasRole(requiredRole);
  const roleLabel = ROLE_LABELS[requiredRole];
  const shouldShowApprovedNotice = !resolvedRole && latestRequest?.status === "approved";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const createdRequest = await createAccessRequest({
        requestedRole: requiredRole,
        reason,
      });
      setRequests((current) => [createdRequest, ...current]);
      setSuccess("Access request submitted. An admin will review it shortly.");
      setReason("");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to submit access request.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefreshAccess() {
    setError(null);
    setSuccess(null);
    setIsRefreshing(true);

    try {
      await refresh();
      navigate(ROLE_ROUTES[requiredRole], { replace: true });
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : "Unable to refresh session.";
      setError(message);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <RouteShell title={`${roleLabel} access required`} subtitle="Request access to continue to this dashboard.">
      <section className="shell-content" aria-label="Role access request">
        <CardPrimitive title={`${roleLabel} dashboard`}>
          {resolvedRole ? (
            <p className="meta">Your account already has this role. Continue to the dashboard.</p>
          ) : null}

          {isLoading ? <p className="meta">Loading your request history...</p> : null}

          {!isLoading && latestRequest ? (
            <div className="access-request-status">
              <p className="meta">
                Latest request: <strong>{latestRequest.status}</strong> on {formatDate(latestRequest.createdAt)}
              </p>
              {latestRequest.reason ? <p className="meta">Reason: {latestRequest.reason}</p> : null}
              {latestRequest.reviewedAt ? (
                <p className="meta">Reviewed on {formatDate(latestRequest.reviewedAt)}</p>
              ) : null}
            </div>
          ) : null}

          {!isLoading && latestRequest?.status === "pending" ? (
            <p className="meta">No further action needed while your request is pending.</p>
          ) : null}

          {!isLoading && latestRequest?.status === "approved" ? (
            <div className="access-request-actions">
              <p className="meta">
                Access is approved. Refresh now. If access still fails, sign out and sign in again to refresh your
                role claims.
              </p>
              <button className="shell-button" type="button" onClick={handleRefreshAccess} disabled={isRefreshing}>
                {isRefreshing ? "Refreshing..." : "Refresh access"}
              </button>
            </div>
          ) : null}

          {shouldShowApprovedNotice ? (
            <p className="native-form-message native-form-success">
              Approval detected. A fresh session may be required before this dashboard unlocks.
            </p>
          ) : null}

          {!isLoading && (!latestRequest || latestRequest.status === "rejected") ? (
            <form className="shell-form" onSubmit={handleSubmit}>
              <label className="shell-label" htmlFor="access-request-reason">
                Why do you need {roleLabel.toLowerCase()} access?
              </label>
              <textarea
                className="shell-input access-request-reason"
                id="access-request-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Optional context for the admin reviewer"
              />
              <button className="shell-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Request access"}
              </button>
            </form>
          ) : null}

          {error ? <p className="native-form-message native-form-error">{error}</p> : null}
          {success ? <p className="native-form-message native-form-success">{success}</p> : null}

          <div className="access-request-links">
            <Link className="site-nav-link access-inline-link" to="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
