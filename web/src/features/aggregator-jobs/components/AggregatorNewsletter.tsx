import { useEffect, useState } from "react";
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
      <div className="newsletter-form">
        <iframe
          width="540"
          height="280"
          src="https://58681e2d.sibforms.com/serve/MUIFAHXVR5tRFBDTcOiuh20_p5-O29yy8k6p5GA7_6vI8Mb29oJKSmjzFdFS_42mJMKpX3gRAnzPHIXoo3rmGHyDPdPUTmBgyYut9bQsy96jN4w0GOoddcGrWFGZYkT0ZFaCl4M5fCzyZig_rPFG-yB2pE-Lqro3GCHZ9det5WfikZkmJgdeG6iMIEktzRDAxSIwlId0D8akd_v1Cw=="
          frameBorder="0"
          scrolling="no"
          allowFullScreen
          title="Newsletter signup form"
        />
      </div>

      <button className="newsletter-dismiss" id="newsletterDismiss" type="button" aria-label="Dismiss newsletter signup" onClick={dismissNewsletter}>
        x
      </button>
    </section>
  );
}
