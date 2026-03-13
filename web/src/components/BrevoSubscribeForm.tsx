import { useEffect, useRef } from "react";

const BREVO_FORM_ACTION =
  "https://58681e2d.sibforms.com/serve/MUIFAHXVR5tRFBDTcOiuh20_p5-O29yy8k6p5GA7_6vI8Mb29oJKSmjzFdFS_42mJMKpX3gRAnzPHIXoo3rmGHyDPdPUTmBgyYut9bQsy96jN4w0GOoddcGrWFGZYkT0ZFaCl4M5fCzyZig_rPFG-yB2pE-Lqro3GCHZ9det5WfikZkmJgdeG6iMIEktzRDAxSIwlId0D8akd_v1Cw==";

const RECAPTCHA_SITE_KEY = "6LeULF4sAAAAAI3inam46zWmw6bR46GUjnAA8HDo";

export function BrevoSubscribeForm() {
  const scriptsLoaded = useRef(false);

  useEffect(() => {
    if (scriptsLoaded.current) return;
    scriptsLoaded.current = true;

    /* Brevo global config */
    const w = window as unknown as Record<string, unknown>;
    w.REQUIRED_CODE_ERROR_MESSAGE = "Please choose a country code";
    w.LOCALE = "en";
    w.EMAIL_INVALID_MESSAGE =
      "The information provided is invalid. Please review the field format and try again.";
    w.SMS_INVALID_MESSAGE =
      "The information provided is invalid. Please review the field format and try again.";
    w.REQUIRED_ERROR_MESSAGE = "This field cannot be left blank. ";
    w.GENERIC_INVALID_MESSAGE =
      "The information provided is invalid. Please review the field format and try again.";
    w.translation = {
      common: {
        selectedList: "{quantity} list selected",
        selectedLists: "{quantity} lists selected",
        selectedOption: "{quantity} selected",
        selectedOptions: "{quantity} selected",
      },
    };
    w.AUTOHIDE = true;

    /* Load Brevo main.js */
    const brevoScript = document.createElement("script");
    brevoScript.src = "https://sibforms.com/forms/end-form/build/main.js";
    brevoScript.defer = true;
    document.body.appendChild(brevoScript);

    /* Load reCAPTCHA */
    if (!document.querySelector(`script[src*="recaptcha/api.js"]`)) {
      const recaptchaScript = document.createElement("script");
      recaptchaScript.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}&hl=en`;
      recaptchaScript.async = true;
      recaptchaScript.defer = true;
      document.body.appendChild(recaptchaScript);
    }
  }, []);

  return (
    <div id="sib-form-container" className="sib-form-container">
      <div
        id="error-message"
        className="sib-form-message-panel brevo-msg brevo-msg--error"
      >
        <p className="brevo-msg-text">
          Your subscription could not be saved. Please try again.
        </p>
      </div>

      <div
        id="success-message"
        className="sib-form-message-panel brevo-msg brevo-msg--success"
      >
        <p className="brevo-msg-text">
          Thank you for subscribing to JobberMed. Please check your email and click the
          confirmation link to activate your subscription. If you don't see the email within a
          few minutes, please check your spam or junk folder.
        </p>
      </div>

      <div id="sib-container" className="sib-container--large sib-container--vertical brevo-form-card">
        <form
          id="sib-form"
          method="POST"
          action={BREVO_FORM_ACTION}
          data-type="subscription"
        >
          <div className="sib-form-block">
            <div className="form__entry entry_block">
              <div className="form__label-row">
                <label className="entry__label brevo-label" htmlFor="EMAIL" data-required="*">
                  Get weekly job alerts
                </label>
                <div className="entry__field">
                  <input
                    className="input brevo-input"
                    type="text"
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
              form="sib-form"
              type="submit"
            >
              <svg
                className="icon clickable__icon progress-indicator__icon sib-hide-loader-icon"
                viewBox="0 0 512 512"
              >
                <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
              </svg>
              Subscribe
            </button>
          </div>

          <div className="g-recaptcha-v3" data-sitekey={RECAPTCHA_SITE_KEY} style={{ display: "none" }} />
          <input type="text" name="email_address_check" value="" className="input--hidden" style={{ display: "none" }} readOnly />
          <input type="hidden" name="locale" value="en" />
        </form>
      </div>
    </div>
  );
}
