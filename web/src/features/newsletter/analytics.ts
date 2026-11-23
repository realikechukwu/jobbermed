import { captureEvent, getAnalyticsVisitorId } from "../../lib/analytics";

export type NewsletterPlacement = "home" | "subscribe" | "prompt";
export type NewsletterEntryPoint = "homepage_inline" | "mobile_drawer" | "footer" | "direct" | "timed_prompt";

type NewsletterEvent =
  | "newsletter form viewed"
  | "newsletter signup submitted"
  | "newsletter signup accepted"
  | "newsletter signup failed"
  | "newsletter subscription confirmed";

const pendingKey = "jobbermed_newsletter_confirmation";
const confirmationWindow = 7 * 24 * 60 * 60 * 1000;

export function subscribeEntryPoint(value: unknown): NewsletterEntryPoint {
  return value === "mobile_drawer" || value === "footer" ? value : "direct";
}

export function captureSubscribeLinkClick(entryPoint: "mobile_drawer" | "footer") {
  captureEvent("newsletter subscribe link clicked", { placement: "subscribe", entry_point: entryPoint });
}

export function captureNewsletterEvent(
  event: NewsletterEvent,
  placement: NewsletterPlacement,
  entryPoint: NewsletterEntryPoint,
  distinctId?: string,
) {
  captureEvent(event, { placement, entry_point: entryPoint }, distinctId);
}

export function rememberNewsletterSignup(placement: NewsletterPlacement, entryPoint: NewsletterEntryPoint) {
  const distinctId = getAnalyticsVisitorId();
  if (!distinctId) return;

  try {
    localStorage.setItem(pendingKey, JSON.stringify({ distinctId, placement, entryPoint, at: Date.now() }));
  } catch {
    // Signup still works when browser storage is unavailable.
  }
}

export function captureNewsletterConfirmation() {
  try {
    const pending = localStorage.getItem(pendingKey);
    if (!pending) return;
    localStorage.removeItem(pendingKey);

    const { distinctId, placement, entryPoint, at } = JSON.parse(pending);
    const elapsed = typeof at === "number" ? Date.now() - at : Infinity;
    const source =
      placement === "home" ? "homepage_inline"
      : placement === "prompt" ? "timed_prompt"
      : placement === "subscribe" ? subscribeEntryPoint(entryPoint)
      : undefined;
    if (typeof distinctId === "string" && source && elapsed >= 0 && elapsed < confirmationWindow) {
      captureNewsletterEvent("newsletter subscription confirmed", placement, source, distinctId);
    }
  } catch {
    // Showing the confirmation does not depend on browser storage.
  }
}
