export const BREVO_SIGNUP_URL =
  "https://58681e2d.sibforms.com/serve/MUIFAHXVR5tRFBDTcOiuh20_p5-O29yy8k6p5GA7_6vI8Mb29oJKSmjzFdFS_42mJMKpX3gRAnzPHIXoo3rmGHyDPdPUTmBgyYut9bQsy96jN4w0GOoddcGrWFGZYkT0ZFaCl4M5fCzyZig_rPFG-yB2pE-Lqro3GCHZ9det5WfikZkmJgdeG6iMIEktzRDAxSIwlId0D8akd_v1Cw==";

const RECAPTCHA_SITE_KEY = "6LeULF4sAAAAAI3inam46zWmw6bR46GUjnAA8HDo";

type Recaptcha = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

let recaptchaLoad: Promise<Recaptcha> | undefined;

function loadRecaptcha(): Promise<Recaptcha> {
  const recaptchaWindow = window as Window & { grecaptcha?: Recaptcha };
  if (recaptchaWindow.grecaptcha?.execute) return Promise.resolve(recaptchaWindow.grecaptcha);

  recaptchaLoad ??= new Promise<Recaptcha>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}&hl=en`;
    script.async = true;
    const timeout = window.setTimeout(() => fail(), 10_000);

    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      recaptchaLoad = undefined;
      reject(new Error("reCAPTCHA could not load"));
    }

    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      const recaptcha = recaptchaWindow.grecaptcha;
      if (recaptcha?.execute) resolve(recaptcha);
      else fail();
    };
    document.head.append(script);
  });
  return recaptchaLoad;
}

export async function requestNewsletterSubscription(form: FormData): Promise<boolean> {
  const recaptcha = await loadRecaptcha();
  const token = await new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("reCAPTCHA timed out")), 10_000);
    recaptcha.ready(() => {
      void recaptcha.execute(RECAPTCHA_SITE_KEY, { action: "submit" }).then(resolve, reject)
        .finally(() => window.clearTimeout(timeout));
    });
  });
  if (!token) return false;

  form.set("g-recaptcha-response", token);
  // Use the same JSON endpoint as Brevo's generated HTML embed.
  const response = await fetch(`${BREVO_SIGNUP_URL}?isAjax=1`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return false;

  const result: { success?: boolean } = await response.json();
  return result.success === true;
}
