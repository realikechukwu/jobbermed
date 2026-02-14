import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { type DashboardRole } from "../features/auth/roles";
import { useSession } from "../features/auth/session-context";
import { fetchCandidateNativeApplications } from "../features/native-jobs/api";
import type { NativeJobApplicationRecord } from "../features/native-jobs/types";
import { RouteShell } from "../layouts/RouteShell";

const ROLE_TITLES: Record<DashboardRole, string> = {
  candidate: "Candidate",
  recruiter: "Recruiter",
  mdcn_official: "MDCN Official",
  admin: "Admin",
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function DashboardPage() {
  const { roles, error: sessionError } = useSession();
  const [applications, setApplications] = useState<NativeJobApplicationRecord[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      setIsLoadingApps(true);
      setAppsError(null);
      try {
        const data = await fetchCandidateNativeApplications();
        if (!isMounted) return;
        setApplications(data);
      } catch (loadError) {
        if (!isMounted) return;
        const message = loadError instanceof Error ? loadError.message : "Unable to load your applications.";
        setAppsError(message);
      } finally {
        if (isMounted) {
          setIsLoadingApps(false);
        }
      }
    }

    void loadApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  const roleList = useMemo(() => {
    const uniqueRoles = [...new Set(roles)];
    if (uniqueRoles.length === 0) {
      return ["Candidate"];
    }
    return uniqueRoles.map((role) => ROLE_TITLES[role] || role);
  }, [roles]);

  return (
    <RouteShell title="Dashboard" subtitle="Manage your role access and native job activity.">
      <section className="shell-grid" aria-label="Dashboard cards">
        <CardPrimitive title="Account roles" meta="Active roles from claims and platform assignments.">
          <p className="meta">{roleList.join(" • ")}</p>
          {sessionError ? <p className="native-form-message native-form-error">{sessionError}</p> : null}
        </CardPrimitive>

        <CardPrimitive title="Role dashboards" meta="Open role-specific workspaces.">
          <div className="dashboard-links">
            <Link className="shell-button dashboard-link" to="/recruiter">
              Recruiter dashboard
            </Link>
            <Link className="shell-button dashboard-link" to="/mdcn">
              MDCN dashboard
            </Link>
            <Link className="shell-button dashboard-link" to="/admin">
              Admin dashboard
            </Link>
          </div>
        </CardPrimitive>
      </section>

      <section className="shell-content dashboard-applications" aria-label="My native applications">
        <CardPrimitive title="My native applications" meta="Your latest direct applications.">
          {isLoadingApps ? <p className="meta">Loading applications...</p> : null}
          {appsError ? <p className="native-form-message native-form-error">{appsError}</p> : null}

          {!isLoadingApps && !appsError && applications.length === 0 ? (
            <p className="meta">No native applications yet.</p>
          ) : null}

          {!isLoadingApps && !appsError && applications.length > 0 ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 10).map((application) => (
                    <tr key={application.id}>
                      <td>{application.jobTitle || "Untitled role"}</td>
                      <td>{application.status}</td>
                      <td>{formatDate(application.submittedAt)}</td>
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
