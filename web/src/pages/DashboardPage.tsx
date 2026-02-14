import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
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

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [preferences, setPreferences] = useState<EmailPreferences>(defaultEmailPreferences);
  const [categoriesInput, setCategoriesInput] = useState("");
  const [locationsInput, setLocationsInput] = useState("");
  const [tableWarning, setTableWarning] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<BannerTone>("info");

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
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

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

    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  const deliveryMode = preferences.personalizeEnabled ? "personalized" : "default_weekly";

  return (
    <RouteShell title="Dashboard" subtitle="Manage weekly fallback and personalized delivery settings.">
      <section className="shell-grid" aria-label="Dashboard cards">
        <CardPrimitive title="Profile" meta="Dashboard route shell">
          <p className="meta">Profile editing and saved-jobs parity stay on the existing migration track.</p>
        </CardPrimitive>

        <CardPrimitive title="Saved jobs" meta="Dashboard route shell">
          <p className="meta">Saved jobs integration is unchanged in this personalization slice.</p>
        </CardPrimitive>

        <CardPrimitive title="Email preferences" meta="Legacy weekly digest remains default unless you opt in.">
          {isLoading ? <p className="meta">Loading preference controls...</p> : null}

          {!isLoading && !userId ? (
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

          {!isLoading && userId ? (
            <form className="preference-form" onSubmit={handleSubmit}>
              <p className="preference-meta">
                Signed in as <strong>{userEmail || "account user"}</strong>
              </p>
              <p className="preference-note">
                Delivery mode: <strong>{deliveryMode}</strong>. Keep personalization off to stay on legacy weekly digest.
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
                <button className="shell-button" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving preferences..." : "Save preferences"}
                </button>
              </div>
            </form>
          ) : null}
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
