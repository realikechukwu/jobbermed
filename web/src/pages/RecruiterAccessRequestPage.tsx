import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { AccessRequestPanel } from "../features/access-requests/components/AccessRequestCard";
import { useSession } from "../features/auth/session-context";
import { RouteShell } from "../layouts/RouteShell";

export function RecruiterAccessRequestPage() {
  const { hasRole } = useSession();
  const hasRecruiterAccess = hasRole("recruiter") || hasRole("admin");

  return (
    <RouteShell title="Recruiter access request" subtitle="Recruiter requests are reviewed by an administrator.">
      <section className="shell-content" aria-label="Recruiter access request">
        <div className="access-request-links">
          <Link className="site-nav-link access-inline-link" to="/dashboard">
            Back to dashboard
          </Link>
        </div>

        <CardPrimitive title="Request recruiter access">
          <p className="meta">
            Recruiter access lets you post jobs and review applicants. Requests are reviewed by an administrator.
          </p>
          {hasRecruiterAccess ? (
            <div className="access-request-status">
              <p className="meta">You already have recruiter access.</p>
              <div className="access-request-links">
                <Link className="shell-button dashboard-link" to="/recruiter">
                  Open recruiter dashboard
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="preference-note">
                After you submit, your request will show as Pending approval. Once approved, click Refresh access to
                activate recruiter tools. If access still does not update, sign out and sign back in.
              </p>
              <AccessRequestPanel requiredRole="recruiter" showHeading={false} />
            </>
          )}
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
