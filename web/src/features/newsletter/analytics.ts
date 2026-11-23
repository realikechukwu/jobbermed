export type NewsletterPlacement = "home" | "subscribe";

type NewsletterEvent =
  | "newsletter form viewed"
  | "newsletter signup submitted"
  | "newsletter signup accepted"
  | "newsletter signup failed"
  | "newsletter subscription confirmed";

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const ingestHost = import.meta.env.VITE_POSTHOG_HOST?.trim();
const pendingKey = "jobbermed_newsletter_confirmation";
const confirmationWindow = 7 * 24 * 60 * 60 * 1000;
let visitorId: string | undefined;

function analyticsEnabled() {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  return Boolean(projectToken && ingestHost && typeof globalThis.crypto?.randomUUID === "function" &&
    privacy.doNotTrack !== "1" && !privacy.globalPrivacyControl);
}

export function captureNewsletterEvent(event: NewsletterEvent, placement: NewsletterPlacement, distinctId?: string) {
  if (!analyticsEnabled()) return;
  visitorId ??= crypto.randomUUID();

  void fetch(`${ingestHost?.replace(/\/$/, "")}/i/v0/e/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    body: JSON.stringify({
      api_key: projectToken,
      event,
      distinct_id: distinctId ?? visitorId,
      timestamp: new Date().toISOString(),
      properties: {
        placement,
        environment: window.location.hostname === "jobbermed.com" ? "production" : "development",
        $process_person_profile: false,
        $geoip_disable: true,
      },
    }),
  }).catch(() => undefined);
}

export function rememberNewsletterSignup(placement: NewsletterPlacement) {
  if (!analyticsEnabled() || !visitorId) return;

  try {
    localStorage.setItem(pendingKey, JSON.stringify({ distinctId: visitorId, placement, at: Date.now() }));
  } catch {
    // Signup still works when browser storage is unavailable.
  }
}

export function captureNewsletterConfirmation() {
  try {
    const pending = localStorage.getItem(pendingKey);
    if (!pending) return;
    localStorage.removeItem(pendingKey);

    const { distinctId, placement, at } = JSON.parse(pending);
    const elapsed = typeof at === "number" ? Date.now() - at : Infinity;
    if (
      typeof distinctId === "string" &&
      (placement === "home" || placement === "subscribe") &&
      elapsed >= 0 && elapsed < confirmationWindow
    ) {
      captureNewsletterEvent("newsletter subscription confirmed", placement, distinctId);
    }
  } catch {
    // Showing the confirmation does not depend on browser storage.
  }
}
