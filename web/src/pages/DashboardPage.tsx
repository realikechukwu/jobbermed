import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { type DashboardRole } from "../features/auth/roles";
import { useSession } from "../features/auth/session-context";
import { fetchCandidateNativeApplications } from "../features/native-jobs/api";
import type { NativeJobApplicationRecord } from "../features/native-jobs/types";
import { getCurrentUser } from "../lib/auth";
import {
  defaultEmailPreferences,
  loadUserEmailPreferencesForUser,
  saveUserEmailPreferencesForUser,
  type EmailFrequency,
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

function splitPreferenceInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinPreferenceInput(values: string[]): string {
  return values.join(", ");
}

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

  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [preferences, setPreferences] = useState<EmailPreferences>(defaultEmailPreferences);
  const [categoriesInput, setCategoriesInput] = useState("");
  const [locationsInput, setLocationsInput] = useState("");
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
            setUserId(null);
            setStatusTone("info");
            setStatusMessage("Sign in to configure personalized email delivery.");
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email ?? "");

        const loaded = await loadUserEmailPreferencesForUser(user.id, supabase);
        if (cancelled) {
          return;
        }

        if (loaded.status === "ok") {
          setPreferences(loaded.preferences);
          setCategoriesInput(joinPreferenceInput(loaded.preferences.categories));
          setLocationsInput(joinPreferenceInput(loaded.preferences.locations));
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      return;
    }

    const nextPreferences: EmailPreferences = {
      ...preferences,
      categories: splitPreferenceInput(categoriesInput),
      locations: splitPreferenceInput(locationsInput),
    };

    setIsSavingPrefs(true);
    setStatusMessage(null);

    try {
      const supabase = getSupabaseClient();
      const result = await saveUserEmailPreferencesForUser(userId, nextPreferences, supabase);

      if (result.status === "ok") {
        setPreferences(result.preferences);
        setCategoriesInput(joinPreferenceInput(result.preferences.categories));
        setLocationsInput(joinPreferenceInput(result.preferences.locations));
        setTableWarning(null);
        setStatusTone("success");
        setStatusMessage("Preferences saved.");
        return;
      }

      if (result.status === "unavailable") {
        setTableWarning(result.reason);
        setStatusTone("info");
        setStatusMessage("Weekly digest fallback remains active.");
        return;
      }

      setStatusTone("error");
      setStatusMessage(result.error);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save preferences.";
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <RouteShell title="Dashboard" subtitle="Manage your role access, native job activity, and email delivery settings.">
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

        <CardPrimitive
          title="Email preferences"
          meta="By default, you'll receive our full nationwide digest: all medical job roles across Nigeria, once a week."
        >
          {isLoadingPrefs ? <p className="meta">Loading preference controls...</p> : null}

          {!isLoadingPrefs && !userId ? (
            <div className="preference-state">
              {statusMessage ? <p className={`status-banner status-${statusTone}`}>{statusMessage}</p> : null}
              <p className="meta">
                Non-dashboard subscribers and dashboard users with no preferences continue receiving the weekly digest.
              </p>
              <Link className="shell-inline-link" to="/signin">
                Sign in to configure personalization
              </Link>
            </div>
          ) : null}

          {!isLoadingPrefs && userId ? (
            <form className="preference-form" onSubmit={handleSubmit}>
              <p className="preference-meta">
                Signed in as <strong>{userEmail || "account user"}</strong>
              </p>
              <p className="preference-note">
                Current delivery: Weekly nationwide digest (default).
              </p>
              <p className="preference-note">
                Choose the job roles and locations you care about, then set how often you want updates (daily or weekly).
              </p>
              <p className="preference-meta">Jobs are updated every day.</p>
              <p className="preference-note">
                Leave personalization off to keep receiving all roles across the country every week.
              </p>

              <label className="preference-checkbox" htmlFor="personalize-enabled">
                <input
                  id="personalize-enabled"
                  type="checkbox"
                  checked={preferences.personalizeEnabled}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      personalizeEnabled: event.target.checked,
                    }))
                  }
                />
                <span>Enable personalized digest</span>
              </label>

              <div className="preference-grid">
                <label className="shell-label" htmlFor="email-frequency">
                  Frequency
                </label>
                <select
                  className="shell-input"
                  id="email-frequency"
                  value={preferences.frequency}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      frequency: event.target.value as EmailFrequency,
                    }))
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>

                <label className="shell-label" htmlFor="category-filter">
                  Categories (comma-separated)
                </label>
                <textarea
                  className="shell-input preference-textarea"
                  id="category-filter"
                  value={categoriesInput}
                  onChange={(event) => setCategoriesInput(event.target.value)}
                  placeholder="Doctor, Nurse, Public Health"
                />

                <label className="shell-label" htmlFor="location-filter">
                  Locations (comma-separated)
                </label>
                <textarea
                  className="shell-input preference-textarea"
                  id="location-filter"
                  value={locationsInput}
                  onChange={(event) => setLocationsInput(event.target.value)}
                  placeholder="Lagos, Abuja, Remote"
                />
              </div>

              {tableWarning ? <p className="status-banner status-info">{tableWarning}</p> : null}
              {statusMessage ? <p className={`status-banner status-${statusTone}`}>{statusMessage}</p> : null}

              <div className="preference-actions">
                <button className="shell-button" type="submit" disabled={isSavingPrefs}>
                  {isSavingPrefs ? "Saving preferences..." : "Save preferences"}
                </button>
              </div>
            </form>
          ) : null}
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
