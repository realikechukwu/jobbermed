import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { type DashboardRole } from "../features/auth/roles";
import { useSession } from "../features/auth/session-context";
import { readSavedJobSummaries } from "../features/aggregator-jobs/hooks/useSavedJobsLocal";
import { fetchCandidateNativeApplications } from "../features/native-jobs/api";
import {
  normalizeCategorySelections,
  summarizeCategorySelections,
} from "../features/preferences/category-options";
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

const SAVED_JOBS_SHOWN = 5;

function formatStatus(value: string): string {
  const words = String(value || "").replace(/_/g, " ").trim();
  return words ? `${words[0].toUpperCase()}${words.slice(1)}` : "-";
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function DashboardPage() {
  const { user, roles, hasRole, error: sessionError } = useSession();
  const navigate = useNavigate();
  const [savedJobs] = useState(() => readSavedJobSummaries());

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
    navigate("/");
  }

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
          setPreferences({
            ...loaded.preferences,
            categories: normalizeCategorySelections(loaded.preferences.categories),
          });
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
    ? summarizeCategorySelections(preferences.categories)
    : "All categories";
  const locationsSummary = preferences.personalizeEnabled
    ? summarizeLocationSelections(preferences.locations)
    : "All locations";

  return (
    <RouteShell title="Dashboard" subtitle="Your saved jobs, applications and job alert emails.">
      <section className="shell-grid" aria-label="Dashboard cards">
        <CardPrimitive title="Saved jobs" meta="Jobs you bookmarked on this device.">
          {savedJobs.length === 0 ? (
            <p className="meta">Nothing saved yet. Tap the bookmark on any job to keep it here.</p>
          ) : (
            <ul className="dashboard-list">
              {savedJobs.slice(0, SAVED_JOBS_SHOWN).map((job) => (
                <li key={job.id}>
                  <strong>{job.title}</strong>
                  {job.company || job.location ? (
                    <span className="meta">{[job.company, job.location].filter(Boolean).join(" · ")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <div className="dashboard-links">
            {savedJobs.length > 0 ? (
              <Link className="shell-button dashboard-link dashboard-link-primary" to="/?saved=1">
                {savedJobs.length > SAVED_JOBS_SHOWN ? `View all ${savedJobs.length} saved jobs` : "Open saved jobs"}
              </Link>
            ) : (
              <Link className="shell-button dashboard-link dashboard-link-primary" to="/">
                Browse jobs
              </Link>
            )}
          </div>
        </CardPrimitive>

        <CardPrimitive title="Job alert emails" meta="New roles sent to your inbox.">
          {isLoadingPrefs ? <p className="meta">Loading your email settings...</p> : null}

          {!isLoadingPrefs ? (
            <div className="access-request-status">
              <p className="meta">
                <strong>Tailored to you:</strong> {personalizationStatus}
              </p>
              <p className="meta">
                <strong>How often:</strong> {frequencySummary}
              </p>
              <p className="meta">
                <strong>Specialties:</strong> {categoriesSummary}
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
              Change email settings
            </Link>
          </div>
        </CardPrimitive>
      </section>

      <section className="shell-content dashboard-applications" aria-label="My applications">
        <CardPrimitive title="My applications" meta="Jobs you applied for directly on JobberMed.">
          {isLoadingApps ? <p className="meta">Loading applications...</p> : null}
          {appsError ? <p className="native-form-message native-form-error">{appsError}</p> : null}

          {!isLoadingApps && !appsError && applications.length === 0 ? (
            <>
              <p className="meta">
                You have not applied to any jobs on JobberMed yet. Applications made on other job boards are not tracked
                here.
              </p>
              <div className="dashboard-links">
                <Link className="shell-button dashboard-link" to="/">
                  Browse jobs
                </Link>
              </div>
            </>
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
                      <td>{formatStatus(application.status)}</td>
                      <td>{formatDate(application.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardPrimitive>
      </section>

      <section className="shell-grid shell-grid--follow" aria-label="Workspaces and account">
        {workspaceLinks.length > 0 ? (
          <CardPrimitive title="Your workspaces" meta="Other areas your account can open.">
            <div className="dashboard-links">
              {workspaceLinks.map((workspace) => (
                <Link key={workspace.id} className="shell-button dashboard-link" to={workspace.to}>
                  {workspace.label}
                </Link>
              ))}
            </div>
          </CardPrimitive>
        ) : null}

        {!hasRecruiterAccess ? (
          <CardPrimitive title="Hiring for a hospital or clinic?" meta="Post jobs and review applicants on JobberMed.">
            <p className="meta">Recruiter access is approved by our team, usually after a short review.</p>
            <div className="dashboard-links">
              <Link className="shell-button dashboard-link" to="/request-access/recruiter">
                Request recruiter access
              </Link>
            </div>
          </CardPrimitive>
        ) : null}

        <CardPrimitive title="Account">
          {user?.email ? (
            <p className="meta">
              Signed in as <strong>{user.email}</strong>
            </p>
          ) : null}
          {roleList.length > 1 ? <p className="meta">Access: {roleList.join(", ")}</p> : null}
          {sessionError ? <p className="native-form-message native-form-error">{sessionError}</p> : null}
          <div className="dashboard-links">
            <Link className="shell-button dashboard-link" to="/account/change-password">
              Change password
            </Link>
            <button className="shell-button dashboard-link" type="button" onClick={() => void handleSignOut()}>
              Sign out
            </button>
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
