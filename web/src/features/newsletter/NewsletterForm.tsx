import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { captureNewsletterEvent, rememberNewsletterSignup, type NewsletterEntryPoint, type NewsletterPlacement } from "./analytics";
import { BREVO_SIGNUP_URL, requestNewsletterSubscription } from "./brevo";
import { rememberNewsletterSubscribed } from "./prompt";
import "./newsletter.css";

type Status = "idle" | "submitting" | "accepted" | "error";

type NewsletterFormProps = {
  placement: NewsletterPlacement;
  entryPoint: NewsletterEntryPoint;
  variant?: "inline" | "prompt";
  onAccepted?: () => void;
};

export function NewsletterForm({ placement, entryPoint, variant = "inline", onAccepted }: NewsletterFormProps) {
  const headingId = useId();
  const emailId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const viewedEntry = useRef<NewsletterEntryPoint>();
  const submitting = useRef(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || viewedEntry.current === entryPoint) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || viewedEntry.current === entryPoint) return;
      viewedEntry.current = entryPoint;
      captureNewsletterEvent("newsletter form viewed", placement, entryPoint);
      observer.disconnect();
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [entryPoint, placement]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    if (data.get("email_address_check")) return;

    if (viewedEntry.current !== entryPoint) {
      viewedEntry.current = entryPoint;
      captureNewsletterEvent("newsletter form viewed", placement, entryPoint);
    }
    captureNewsletterEvent("newsletter signup submitted", placement, entryPoint);
    submitting.current = true;
    setStatus("submitting");

    try {
      if (!(await requestNewsletterSubscription(data))) throw new Error("Signup was not accepted");

      rememberNewsletterSignup(placement, entryPoint);
      rememberNewsletterSubscribed();
      captureNewsletterEvent("newsletter signup accepted", placement, entryPoint);
      setStatus("accepted");
      onAccepted?.();
    } catch {
      captureNewsletterEvent("newsletter signup failed", placement, entryPoint);
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section
      className={variant === "prompt" ? "newsletter-signup newsletter-signup--prompt" : "newsletter-signup"}
      aria-labelledby={headingId}
      ref={sectionRef}
    >
      <h2 id={headingId}>Get weekly job alerts</h2>
      {status === "accepted" ? (
        <p role="status">Check your email for a link to confirm your subscription.</p>
      ) : (
        <>
          {variant === "prompt" ? <p className="newsletter-signup-intro">New healthcare vacancies in your inbox each week.</p> : null}
          <form className="newsletter-signup-form" onSubmit={handleSubmit}>
            <div className="shell-field">
              <label className="shell-label" htmlFor={emailId}>Email address</label>
              <input className="shell-input" id={emailId} name="EMAIL" type="email" autoComplete="email" required />
            </div>
            <input type="hidden" name="locale" value="en" />
            <input type="text" name="email_address_check" autoComplete="off" hidden />
            <button className="shell-button" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
          {status === "error" ? (
            <p role="alert">
              We couldn’t submit your signup. Try again or <a href={BREVO_SIGNUP_URL}>use the Brevo form</a>.
            </p>
          ) : null}
          <p className="newsletter-privacy">
            <Link to="/privacy">Privacy policy</Link> · Protected by reCAPTCHA ·{" "}
            <a href="https://policies.google.com/privacy">Google Privacy</a> ·{" "}
            <a href="https://policies.google.com/terms">Terms</a>
          </p>
        </>
      )}
    </section>
  );
}
