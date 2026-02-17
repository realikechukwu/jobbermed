import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { type DashboardRole } from "../features/auth/roles";
import { useSession } from "../features/auth/session-context";
import { fetchCandidateNativeApplications } from "../features/native-jobs/api";
import { summarizeLocationSelections } from "../features/preferences/location-options";
import type { NativeJobApplicationRecord } from "../features/native-jobs/types";
import { getCurrentUser } from "../lib/auth";
import {
  defaultEmailPreferences,
  loadUserEmailPreferencesForUser,
  type EmailPreferences,
} from "../lib/email-preferences";
import { getSupabaseClient } from "../lib/supabase-client";
import { RouteShell } from "../layouts/RouteShell";

const ROLE_TITLES: Record<DashboardRole, string> = {
  candidate: "Candidate",
  recruiter: "Recruiter",
  mdcn_official: "MDCN Official",
  admin: "Admin",
};

type BannerTone = "info" | "success" | "error";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function summarizeCategories(values: string[]): string {
  if (values.length === 0) {
    return "All categories";
  }

  if (values.length === 1) {
    return values[0];
  }

  return `${values.length} selections`;
}

export function DashboardPage() {
  const { roles, hasRole, error: sessionError } = useSession();
  const [applications, setApplications] = useState<NativeJobApplicationRecord[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);

  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [preferences, setPreferences] = useState<EmailPreferences>(defaultEmailPreferences);
  const [tableWarning, setTableWarning] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<BannerTone>("info");

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

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const supabase = getSupabaseClient();
        const user = await getCurrentUser(supabase);

        if (!user) {
          if (!cancelled) {
            setStatusTone("info");
            setStatusMessage("Sign in to configure personalised email delivery.");
          }
          return;
        }

        if (cancelled) {
          return;
        }

        const loaded = await loadUserEmailPreferencesForUser(user.id, supabase);
        if (cancelled) {
          return;
        }

        if (loaded.status === "ok") {
          setPreferences(loaded.preferences);
          setTableWarning(null);
          setStatusMessage(null);
          return;
        }

        if (loaded.status === "unavailable") {
          setTableWarning(loaded.reason);
          setStatusTone("info");
          setStatusMessage("Weekly digest fallback remains active until preferences are available.");
          return;
        }

        setStatusTone("error");
        setStatusMessage(loaded.error);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load dashboard settings.";
          setStatusTone("error");
          setStatusMessage(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPrefs(false);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const roleList = useMemo(() => {
    const uniqueRoles = [...new Set(roles)];
    if (uniqueRoles.length === 0) {
      return ["Candidate"];
    }
    return uniqueRoles.map((role) => ROLE_TITLES[role] || role);
  }, [roles]);

  const hasAdminAccess = hasRole("admin");
  const hasRecruiterAccess = hasRole("recruiter") || hasAdminAccess;
  const hasMdcnAccess = hasRole("mdcn_official") || hasAdminAccess;

  const workspaceLinks = useMemo(
    () =>
      [
        hasRecruiterAccess ? { id: "recruiter", to: "/recruiter", label: "Recruiter dashboard" } : null,
        hasMdcnAccess ? { id: "mdcn", to: "/mdcn", label: "MDCN dashboard" } : null,
        hasAdminAccess ? { id: "admin", to: "/admin", label: "Admin dashboard" } : null,
      ].filter((item): item is { id: string; to: string; label: string } => item !== null),
    [hasAdminAccess, hasMdcnAccess, hasRecruiterAccess],
  );

  const personalizationStatus = preferences.personalizeEnabled ? "On" : "Off";
  const frequencySummary = preferences.personalizeEnabled
    ? preferences.frequency === "daily"
      ? "Daily"
      : "Weekly"
    : "Weekly (default)";
  const categoriesSummary = preferences.personalizeEnabled
    ? summarizeCategories(preferences.categories)
    : "All categories";
  const locationsSummary = preferences.personalizeEnabled
    ? summarizeLocationSelections(preferences.locations)
    : "All locations";

  return (
    <RouteShell title="Dashboard" subtitle="Manage your role access, native job activity, and email delivery settings.">
      <section className="shell-grid" aria-label="Dashboard cards">
        <CardPrimitive title="Account roles" meta="Active roles from claims and platform assignments.">
          <p className="meta">{roleList.join(" • ")}</p>
          {sessionError ? <p className="native-form-message native-form-error">{sessionError}</p> : null}
          <p className="meta auth-aux-link">
            <Link to="/account/change-password">Change password</Link>
          </p>
        </CardPrimitive>

        <CardPrimitive title="Your workspaces" meta="Open dashboards available to your current role access.">
          {workspaceLinks.length === 0 ? (
            <p className="meta">No role-specific dashboards are available for your account yet.</p>
          ) : (
            <div className="dashboard-links">
              {workspaceLinks.map((workspace) => (
                <Link key={workspace.id} className="shell-button dashboard-link" to={workspace.to}>
                  {workspace.label}
                </Link>
              ))}
            </div>
          )}
        </CardPrimitive>

        {hasRecruiterAccess ? (
          <CardPrimitive title="Recruiter workspace">
            <p className="meta">Manage your job posts and review applicants.</p>
            <div className="dashboard-links">
              <Link className="shell-button dashboard-link" to="/recruiter">
                Manage jobs
              </Link>
            </div>
          </CardPrimitive>
        ) : (
          <CardPrimitive title="Recruiter access">
            <div className="access-request-status">
              <p>Post jobs and manage applicants. Requires admin approval.</p>
              <p className="preference-meta">If approved, refresh access to activate your recruiter dashboard.</p>
            </div>
            <div className="dashboard-links">
              <Link className="shell-button dashboard-link" to="/request-access/recruiter">
                Request recruiter access
              </Link>
            </div>
          </CardPrimitive>
        )}

        <CardPrimitive
          title="Email personalisation"
          meta="Review your current digest settings and open full controls."
        >
          {isLoadingPrefs ? <p className="meta">Loading personalisation summary...</p> : null}

          {!isLoadingPrefs ? (
            <div className="access-request-status">
              <p className="meta">
                <strong>Status:</strong> {personalizationStatus}
              </p>
              <p className="meta">
                <strong>Frequency:</strong> {frequencySummary}
              </p>
              <p className="meta">
                <strong>Categories:</strong> {categoriesSummary}
              </p>
              <p className="meta">
                <strong>Locations:</strong> {locationsSummary}
              </p>
            </div>
          ) : null}

          {tableWarning ? <p className="status-banner status-info">{tableWarning}</p> : null}
          {statusMessage ? <p className={`status-banner status-${statusTone}`}>{statusMessage}</p> : null}

          <div className="dashboard-links">
            <Link className="shell-button dashboard-link" to="/account/personalization">
              Manage personalisation
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
