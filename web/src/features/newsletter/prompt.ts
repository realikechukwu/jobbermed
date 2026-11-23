import { captureEvent } from "../../lib/analytics";

const promptKey = "jobbermed_newsletter_prompt";
const snoozeLength = 14 * 24 * 60 * 60 * 1000;

type PromptState = { dismissedAt?: unknown; subscribedAt?: unknown };

export type PromptDismissMethod = "close_button" | "no_thanks" | "escape";

// Undefined means the browser won't let us read storage. The prompt then stays hidden,
// because we couldn't remember a dismissal and would show it on every visit.
function readState(): PromptState | undefined {
  let saved: string | null;
  try {
    saved = localStorage.getItem(promptKey);
  } catch {
    return undefined;
  }

  try {
    const state: unknown = saved ? JSON.parse(saved) : {};
    return state && typeof state === "object" ? (state as PromptState) : {};
  } catch {
    return {};
  }
}

function saveState(update: PromptState) {
  try {
    localStorage.setItem(promptKey, JSON.stringify({ ...readState(), ...update }));
  } catch {
    // Nothing else to do: the prompt is already closed for this visit.
  }
}

export function newsletterPromptAllowed(now = Date.now()): boolean {
  const state = readState();
  if (!state || state.subscribedAt !== undefined) return false;

  const { dismissedAt } = state;
  return typeof dismissedAt !== "number" || now < dismissedAt || now - dismissedAt >= snoozeLength;
}

export function rememberNewsletterPromptDismissed() {
  saveState({ dismissedAt: Date.now() });
}

/** Called after any signup, so the prompt never asks someone who already subscribed. */
export function rememberNewsletterSubscribed() {
  saveState({ subscribedAt: Date.now() });
}

export function captureNewsletterPromptDismissed(page: string, method: PromptDismissMethod) {
  captureEvent("newsletter prompt dismissed", { placement: "prompt", entry_point: "timed_prompt", page, method });
}
