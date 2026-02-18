import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import {
  CATEGORY_OPTIONS,
  getCategoryLabel,
  normalizeCategorySelections,
  summarizeCategorySelections,
  toggleCategorySelection,
} from "../features/preferences/category-options";
import {
  getLocationLabel,
  normalizeLocationSelections,
  SPECIAL_LOCATION_OPTIONS,
  STATE_LOCATION_OPTIONS,
  toggleLocationSelection,
} from "../features/preferences/location-options";
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

export function PersonalizationPage() {
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [preferences, setPreferences] = useState<EmailPreferences>(defaultEmailPreferences);
  const [locationQuery, setLocationQuery] = useState("");
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
            setStatusMessage("Sign in to configure personalised email delivery.");
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
          setPreferences({
            ...loaded.preferences,
            categories: normalizeCategorySelections(loaded.preferences.categories),
            locations: normalizeLocationSelections(loaded.preferences.locations),
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
          const message = error instanceof Error ? error.message : "Failed to load personalisation settings.";
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

  const categoryOptions = useMemo(() => {
    const knownValues = new Set(CATEGORY_OPTIONS.map((option) => option.value));
    const unknownSelections = normalizeCategorySelections(preferences.categories)
      .filter((value) => !knownValues.has(value))
      .map((value) => ({ value, label: getCategoryLabel(value) }));
    return [...CATEGORY_OPTIONS, ...unknownSelections];
  }, [preferences.categories]);

  const selectedCategorySet = useMemo(() => new Set(normalizeCategorySelections(preferences.categories)), [preferences.categories]);

  const selectedLocationSet = useMemo(
    () => new Set(normalizeLocationSelections(preferences.locations)),
    [preferences.locations],
  );

  const filteredStateOptions = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    if (!query) {
      return STATE_LOCATION_OPTIONS;
    }

    return STATE_LOCATION_OPTIONS.filter((option) => option.label.toLowerCase().includes(query));
  }, [locationQuery]);

  const selectedLocationSummary = useMemo(() => {
    const labels = normalizeLocationSelections(preferences.locations).map((value) => getLocationLabel(value));
    if (labels.length === 0) {
      return "All locations";
    }
    return labels.join(" • ");
  }, [preferences.locations]);

  const selectedCategorySummary = useMemo(
    () => summarizeCategorySelections(preferences.categories),
    [preferences.categories],
  );

  const handleCategoryToggle = (category: string) => {
    setPreferences((current) => ({
      ...current,
      categories: toggleCategorySelection(current.categories, category),
    }));
  };

  const handleLocationToggle = (value: string) => {
    setPreferences((current) => ({
      ...current,
      locations: toggleLocationSelection(current.locations, value),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      return;
    }

    const nextPreferences: EmailPreferences = {
      ...preferences,
      categories: normalizeCategorySelections(preferences.categories),
      locations: normalizeLocationSelections(preferences.locations),
    };

    setIsSavingPrefs(true);
    setStatusMessage(null);

    try {
      const supabase = getSupabaseClient();
      const result = await saveUserEmailPreferencesForUser(userId, nextPreferences, supabase);

      if (result.status === "ok") {
        setPreferences({
          ...result.preferences,
          categories: normalizeCategorySelections(result.preferences.categories),
          locations: normalizeLocationSelections(result.preferences.locations),
        });
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
    <RouteShell title="Personalisation settings" subtitle="Control categories, locations, and delivery frequency.">
      <section className="shell-content" aria-label="Personalisation settings">
        <CardPrimitive title="Email preferences" meta="Weekly nationwide digest by default.">
          {isLoadingPrefs ? <p className="meta">Loading preference controls...</p> : null}

          {!isLoadingPrefs && !userId ? (
            <div className="preference-state">
              {statusMessage ? <p className={`status-banner status-${statusTone}`}>{statusMessage}</p> : null}
              <p className="meta">Sign in to update personalisation preferences.</p>
              <Link className="shell-inline-link" to="/signin">
                Go to sign in
              </Link>
            </div>
          ) : null}

          {!isLoadingPrefs && userId ? (
            <form className="preference-form" onSubmit={handleSubmit}>
              <p className="preference-meta">
                Signed in as <strong>{userEmail || "account user"}</strong>
              </p>
              <p className="preference-note">
                {preferences.personalizeEnabled
                  ? `Current delivery: Personalised ${preferences.frequency} updates.`
                  : "Current delivery: Weekly nationwide digest (default)."}
              </p>
              <p className="preference-meta">Jobs update daily.</p>

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
                <span>Enable personalised digest</span>
              </label>

              {preferences.personalizeEnabled ? (
                <div className="preference-grid">
                  <p className="preference-note">Select categories, locations, and frequency for tailored updates.</p>

                  <div className="preference-section">
                    <h3 className="preference-section-title">Frequency</h3>
                    <p className="preference-section-subtitle">Choose how often you want personalised updates.</p>
                    <label className="shell-label" htmlFor="email-frequency">
                      Delivery frequency
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
                  </div>

                  <div className="preference-section">
                    <h3 className="preference-section-title">Categories</h3>
                    <p className="preference-section-subtitle">Select one or more job categories to prioritize.</p>
                    <div className="preference-source-group" id="category-filter">
                      {categoryOptions.map((category) => {
                        const isChecked = selectedCategorySet.has(category.value);
                        return (
                          <label key={category.value} className="preference-source">
                            <input
                              type="checkbox"
                              value={category.value}
                              checked={isChecked}
                              onChange={() => handleCategoryToggle(category.value)}
                            />
                            <span>{category.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="preference-meta">Selected: {selectedCategorySummary}</p>
                  </div>

                  <div className="preference-section">
                    <h3 className="preference-section-title">Locations</h3>
                    <p className="preference-section-subtitle">
                      Select one or more locations for tailored matches.
                    </p>
                    <p className="preference-meta">
                      Choosing All states clears specific state picks. Selecting any state clears All states.
                    </p>
                    <div className="preference-source-group">
                      {SPECIAL_LOCATION_OPTIONS.map((option) => {
                        const isChecked = selectedLocationSet.has(option.value);
                        return (
                          <label key={option.value} className="preference-source">
                            <input
                              type="checkbox"
                              value={option.value}
                              checked={isChecked}
                              onChange={() => handleLocationToggle(option.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <label className="shell-label" htmlFor="state-filter">
                      Search states
                    </label>
                    <input
                      className="shell-input"
                      id="state-filter"
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="Search state name"
                    />

                    <div className="preference-source-group">
                      {filteredStateOptions.map((option) => {
                        const isChecked = selectedLocationSet.has(option.value);
                        return (
                          <label key={option.value} className="preference-source">
                            <input
                              type="checkbox"
                              value={option.value}
                              checked={isChecked}
                              onChange={() => handleLocationToggle(option.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {filteredStateOptions.length === 0 ? <p className="meta">No states match your search.</p> : null}
                    <p className="preference-meta">Selected: {selectedLocationSummary}</p>
                  </div>
                </div>
              ) : (
                <p className="preference-note">
                  Personalisation is off. You'll continue receiving all roles nationwide each week.
                </p>
              )}

              {tableWarning ? <p className="status-banner status-info">{tableWarning}</p> : null}
              {statusMessage ? <p className={`status-banner status-${statusTone}`}>{statusMessage}</p> : null}

              <div className="preference-actions">
                <button className="shell-button" type="submit" disabled={isSavingPrefs}>
                  {isSavingPrefs ? "Saving preferences..." : "Save preferences"}
                </button>
              </div>
            </form>
          ) : null}

          <p className="meta auth-aux-link">
            <Link to="/dashboard">Back to dashboard</Link>
          </p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
