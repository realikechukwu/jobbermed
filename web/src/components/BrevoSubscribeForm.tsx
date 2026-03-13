import { FormEvent, useEffect, useRef, useState } from "react";

const BREVO_FORM_ACTION =
  "https://58681e2d.sibforms.com/serve/MUIFAHXVR5tRFBDTcOiuh20_p5-O29yy8k6p5GA7_6vI8Mb29oJKSmjzFdFS_42mJMKpX3gRAnzPHIXoo3rmGHyDPdPUTmBgyYut9bQsy96jN4w0GOoddcGrWFGZYkT0ZFaCl4M5fCzyZig_rPFG-yB2pE-Lqro3GCHZ9det5WfikZkmJgdeG6iMIEktzRDAxSIwlId0D8akd_v1Cw==";

const RECAPTCHA_SITE_KEY = "6LeULF4sAAAAAI3inam46zWmw6bR46GUjnAA8HDo";

type Status = "idle" | "submitting" | "success" | "error";

export function BrevoSubscribeForm() {
  const recaptchaLoaded = useRef(false);
  const [status, setStatus] = useState<Status>("idle");

  /* Load reCAPTCHA script once */
  useEffect(() => {
    if (recaptchaLoaded.current) return;
    recaptchaLoaded.current = true;

    if (!document.querySelector(`script[src*="recaptcha/api.js"]`)) {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}&hl=en`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      /* Get reCAPTCHA v3 token */
      const grecaptcha = (window as unknown as Record<string, unknown>).grecaptcha as
        | { execute: (key: string, opts: { action: string }) => Promise<string> }
        | undefined;

      if (grecaptcha?.execute) {
        const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "submit" });
        formData.set("g-recaptcha-response", token);
      }

      const res = await fetch(BREVO_FORM_ACTION, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="sib-form-container">
      {status === "error" && (
        <div className="brevo-msg brevo-msg--error brevo-msg--visible">
          <p className="brevo-msg-text">
            Your subscription could not be saved. Please try again.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="brevo-msg brevo-msg--success brevo-msg--visible">
          <p className="brevo-msg-text">
            Thank you for subscribing to JobberMed. Please check your email and click the
            confirmation link to activate your subscription. If you don't see the email within a
            few minutes, please check your spam or junk folder.
          </p>
        </div>
      )}

      {status !== "success" && (
        <div className="sib-container--large sib-container--vertical brevo-form-card">
          <form onSubmit={handleSubmit}>
            <div className="sib-form-block">
              <div className="form__entry entry_block">
                <div className="form__label-row">
                  <label className="entry__label brevo-label" htmlFor="EMAIL" data-required="*">
                    Get weekly job alerts
                  </label>
                  <div className="entry__field">
                    <input
                      className="input brevo-input"
                      type="email"
                      id="EMAIL"
                      name="EMAIL"
                      autoComplete="off"
                      placeholder="enter your email"
                      data-required="true"
                      required
                    />
                  </div>
                </div>
                <label className="entry__error entry__error--primary brevo-field-error" />
                <span className="entry__specification brevo-helper">
                  Join 500+ healthcare professionals. Every Monday
                </span>
              </div>
            </div>

            <div className="sib-form-block brevo-submit-wrap">
              <button
                className="sib-form-block__button sib-form-block__button-with-loader brevo-submit"
                type="submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <svg
                      className="icon clickable__icon progress-indicator__icon brevo-spinner"
                      viewBox="0 0 512 512"
                    >
                      <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
                    </svg>
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </div>

            <p className="brevo-recaptcha-notice">
              Protected by reCAPTCHA —{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
              {" · "}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms</a>
            </p>

            {/* Honeypot field — hidden from real users */}
            <input type="text" name="email_address_check" value="" style={{ display: "none" }} readOnly />
            <input type="hidden" name="locale" value="en" />
          </form>
        </div>
      )}
    </div>
  );
}
