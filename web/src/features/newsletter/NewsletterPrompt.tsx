import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
import { useLocation } from "react-router-dom";
import { publicPagePath } from "../../lib/public-pages";
import { useSession } from "../auth/session-context";
import { NewsletterForm } from "./NewsletterForm";
import {
  captureNewsletterPromptDismissed,
  newsletterPromptAllowed,
  rememberNewsletterPromptDismissed,
  type PromptDismissMethod,
} from "./prompt";
import "./newsletter.css";

const visibleTimeBeforePrompt = 15_000;
const busyRecheckInterval = 1_000;
const pagesWithoutPrompt = new Set(["/privacy", "/subscribe", "/subscribe/confirmed"]);

function promptPage(pathname: string) {
  const page = publicPagePath(pathname);
  return page && !pagesWithoutPrompt.has(page) ? page : undefined;
}

function isTextField(element: Element | null) {
  return element instanceof HTMLElement && (element.matches("input, textarea, select") || element.isContentEditable);
}

// Wait while a job panel or the menu is open, the visitor is typing, or the tab is in the background.
function pageIsBusy() {
  return document.visibilityState !== "visible" || Boolean(document.querySelector("dialog[open]")) || isTextField(document.activeElement);
}

/** Becomes true once the tab has been visible for `limit` ms in total. Time in a background tab doesn't count. */
function useVisibleTime(limit: number) {
  const [reached, setReached] = useState(false);

  useEffect(() => {
    if (reached) return;
    let remaining = limit;
    let startedAt = 0;
    let timer: number | undefined;

    const pause = () => {
      if (timer === undefined) return;
      window.clearTimeout(timer);
      timer = undefined;
      remaining -= performance.now() - startedAt;
    };
    const resume = () => {
      if (timer !== undefined || document.visibilityState !== "visible") return;
      startedAt = performance.now();
      timer = window.setTimeout(() => setReached(true), Math.max(remaining, 0));
    };
    const onVisibilityChange = () => (document.visibilityState === "visible" ? resume() : pause());

    resume();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      pause();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [limit, reached]);

  return reached;
}

export function NewsletterPrompt() {
  const { pathname } = useLocation();
  const { user } = useSession();
  const timeReached = useVisibleTime(visibleTimeBeforePrompt);
  const [state, setState] = useState<"waiting" | "open" | "closed">("waiting");
  const [accepted, setAccepted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const page = promptPage(pathname);
  // Signed-in members already get alerts through their account settings. The session usually
  // resolves long before 15 s; if it resolves later, the prompt hides as soon as `user` is set.
  const eligible = Boolean(page) && !user;
  const visible = state === "open" && eligible;

  useEffect(() => {
    if (state !== "waiting" || !timeReached || !eligible) return;

    const tryOpen = () => {
      if (pageIsBusy()) return false;
      setState(newsletterPromptAllowed() ? "open" : "closed");
      return true;
    };
    if (tryOpen()) return;

    const interval = window.setInterval(() => {
      if (tryOpen()) window.clearInterval(interval);
    }, busyRecheckInterval);
    return () => window.clearInterval(interval);
  }, [state, timeReached, eligible]);

  const close = useCallback(
    (method: PromptDismissMethod, fromKeyboard: boolean) => {
      if (!accepted) {
        rememberNewsletterPromptDismissed();
        captureNewsletterPromptDismissed(page ?? pathname, method);
      }
      // Keyboard users go back to where they were. Mouse and touch users keep their place on the page.
      const target = returnFocus.current;
      if (fromKeyboard && containerRef.current?.contains(document.activeElement) && target?.isConnected) {
        target.focus();
      }
      setState("closed");
    },
    [accepted, page, pathname],
  );

  useEffect(() => {
    if (!visible) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open]")) return;
      const target = event.target instanceof Element ? event.target : null;
      // Leave Esc alone in the site's own fields, such as the job search box.
      if (isTextField(target) && !containerRef.current?.contains(target)) return;
      close("escape", true);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, close]);

  function rememberFocusOrigin(event: FocusEvent<HTMLDivElement>) {
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && !event.currentTarget.contains(from)) returnFocus.current = from;
  }

  function closeFromButton(method: PromptDismissMethod) {
    return (event: MouseEvent<HTMLButtonElement>) => close(method, event.currentTarget.matches(":focus-visible"));
  }

  if (!visible) return null;

  return (
    <div className="newsletter-prompt" ref={containerRef} onFocus={rememberFocusOrigin}>
      <button className="newsletter-prompt-close" type="button" aria-label="Close job alerts signup" onClick={closeFromButton("close_button")}>
        ✕
      </button>
      <NewsletterForm placement="prompt" entryPoint="timed_prompt" variant="prompt" onAccepted={() => setAccepted(true)} />
      {accepted ? null : (
        <button className="newsletter-prompt-dismiss" type="button" onClick={closeFromButton("no_thanks")}>
          No thanks
        </button>
      )}
    </div>
  );
}
