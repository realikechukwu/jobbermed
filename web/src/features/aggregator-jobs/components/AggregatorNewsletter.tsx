import { useEffect, useState } from "react";
import { BrevoSubscribeForm } from "../../../components/BrevoSubscribeForm";
import { NEWSLETTER_DISMISS_DAYS, NEWSLETTER_STORAGE_KEY } from "../constants";

function isNewsletterDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const dismissedAt = window.localStorage.getItem(NEWSLETTER_STORAGE_KEY);
  if (!dismissedAt) {
    return false;
  }

  const dismissedDateMs = Number.parseInt(dismissedAt, 10);
  if (Number.isNaN(dismissedDateMs)) {
    return false;
  }

  const millisecondsSinceDismissed = Date.now() - dismissedDateMs;
  const daysSinceDismissed = millisecondsSinceDismissed / (1000 * 60 * 60 * 24);
  return daysSinceDismissed < NEWSLETTER_DISMISS_DAYS;
}

export function AggregatorNewsletter() {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    setIsHidden(isNewsletterDismissed());
  }, []);

  function dismissNewsletter() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NEWSLETTER_STORAGE_KEY, Date.now().toString());
    }

    setIsHidden(true);
  }

  return (
    <section className={`newsletter-section${isHidden ? " hidden" : ""}`} id="newsletterSection">
      <div className="newsletter-native">
        <BrevoSubscribeForm />
      </div>

      <button
        className="newsletter-dismiss"
        id="newsletterDismiss"
        type="button"
        aria-label="Dismiss newsletter signup"
        onClick={dismissNewsletter}
      >
        ✕
      </button>
    </section>
  );
}
