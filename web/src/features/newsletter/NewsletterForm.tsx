import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { captureNewsletterEvent, rememberNewsletterSignup, type NewsletterPlacement } from "./analytics";
import { BREVO_SIGNUP_URL, requestNewsletterSubscription } from "./brevo";
import "./newsletter.css";

type Status = "idle" | "submitting" | "accepted" | "error";

export function NewsletterForm({ placement }: { placement: NewsletterPlacement }) {
  const headingId = useId();
  const emailId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const viewed = useRef(false);
  const submitting = useRef(false);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || viewed.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || viewed.current) return;
      viewed.current = true;
      captureNewsletterEvent("newsletter form viewed", placement);
      observer.disconnect();
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [placement]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    if (data.get("email_address_check")) return;

    if (!viewed.current) {
      viewed.current = true;
      captureNewsletterEvent("newsletter form viewed", placement);
    }
    captureNewsletterEvent("newsletter signup submitted", placement);
    submitting.current = true;
    setStatus("submitting");

    try {
      if (!(await requestNewsletterSubscription(data))) throw new Error("Signup was not accepted");

      rememberNewsletterSignup(placement);
      captureNewsletterEvent("newsletter signup accepted", placement);
      setStatus("accepted");
    } catch {
      captureNewsletterEvent("newsletter signup failed", placement);
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section className="newsletter-signup" aria-labelledby={headingId} ref={sectionRef}>
      <h2 id={headingId}>Get weekly job alerts</h2>
      {status === "accepted" ? (
        <p role="status">Check your email for a link to confirm your subscription.</p>
      ) : (
        <>
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
