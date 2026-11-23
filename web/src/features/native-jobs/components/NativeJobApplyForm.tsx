import { type ChangeEvent, type FormEvent, useState } from "react";
import { captureJobEvent, type JobAnalyticsProperties } from "../../jobs/analytics";
import { submitNativeJobApplication } from "../api";

type NativeJobApplyFormProps = {
  jobId: string;
  jobTitle: string;
  analyticsJob?: JobAnalyticsProperties;
};

type ApplicationFormState = {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  cvUrl: string;
  coverLetter: string;
};

const initialState: ApplicationFormState = {
  applicantName: "",
  applicantEmail: "",
  applicantPhone: "",
  cvUrl: "",
  coverLetter: "",
};

function isEmailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function NativeJobApplyForm({ jobId, jobTitle, analyticsJob }: NativeJobApplyFormProps) {
  const [formState, setFormState] = useState<ApplicationFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField =
    (field: keyof ApplicationFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((current) => ({ ...current, [field]: event.target.value }));
    };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const applicantName = formState.applicantName.trim();
    const applicantEmail = formState.applicantEmail.trim();
    const applicantPhone = formState.applicantPhone.trim();
    const cvUrl = formState.cvUrl.trim();
    const coverLetter = formState.coverLetter.trim();

    if (applicantName.length < 2) {
      setError("Enter your full name.");
      return;
    }

    if (!isEmailValid(applicantEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (coverLetter.length < 40) {
      setError("Cover letter should be at least 40 characters.");
      return;
    }

    if (cvUrl && !isHttpUrl(cvUrl)) {
      setError("Enter a valid web link (starting with https://) to your CV.");
      return;
    }

    setIsSubmitting(true);
    if (analyticsJob) captureJobEvent("job application started", analyticsJob, "direct_apply");

    try {
      await submitNativeJobApplication({
        jobId,
        applicantName,
        applicantEmail,
        applicantPhone,
        coverLetter,
        cvUrl,
      });
      if (analyticsJob) captureJobEvent("job application submitted", analyticsJob, "direct_apply");
      setSuccess(`Application submitted for "${jobTitle}".`);
      setFormState(initialState);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not submit your application.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="native-apply-form" onSubmit={handleSubmit}>
      <div className="shell-field">
        <label className="shell-label" htmlFor="native-apply-name">
          Full name
        </label>
        <input
          className="shell-input"
          id="native-apply-name"
          name="applicant_name"
          autoComplete="name"
          minLength={2}
          aria-errormessage="native-apply-name-error"
          value={formState.applicantName}
          onChange={updateField("applicantName")}
          placeholder="Your full name"
          required
        />
        <span id="native-apply-name-error" className="field-error-msg">
          <span aria-hidden="true">⚠ </span>Please enter your full name (at least 2 characters).
        </span>
      </div>

      <div className="shell-field">
        <label className="shell-label" htmlFor="native-apply-email">
          Email
        </label>
        <input
          className="shell-input"
          id="native-apply-email"
          name="applicant_email"
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-errormessage="native-apply-email-error"
          value={formState.applicantEmail}
          onChange={updateField("applicantEmail")}
          placeholder="you@example.com"
          required
        />
        <span id="native-apply-email-error" className="field-error-msg">
          <span aria-hidden="true">⚠ </span>Please enter a valid email address.
        </span>
      </div>

      <div className="shell-field">
        <label className="shell-label" htmlFor="native-apply-phone">
          Phone
        </label>
        <input
          className="shell-input"
          id="native-apply-phone"
          name="applicant_phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={formState.applicantPhone}
          onChange={updateField("applicantPhone")}
          placeholder="+234..."
        />
      </div>

      <div className="shell-field">
        <label className="shell-label" htmlFor="native-apply-cv">
          CV link
        </label>
        <p id="native-apply-cv-hint" className="preference-meta">
          Please upload a link to your CV. Kindly upload it to a drive and share the link as a shared file here.
        </p>
        <input
          className="shell-input"
          id="native-apply-cv"
          name="cv_url"
          type="url"
          inputMode="url"
          aria-describedby="native-apply-cv-hint"
          aria-errormessage="native-apply-cv-error"
          value={formState.cvUrl}
          onChange={updateField("cvUrl")}
          placeholder="https://drive.google.com/..."
        />
        <span id="native-apply-cv-error" className="field-error-msg">
          <span aria-hidden="true">⚠ </span>Please enter a valid URL starting with https:// or http://.
        </span>
      </div>

      <div className="shell-field">
        <label className="shell-label" htmlFor="native-apply-cover-letter">
          Cover letter
        </label>
        <span id="native-apply-cover-hint" className="shell-hint">
          At least 40 characters.
        </span>
        <textarea
          className="shell-input native-apply-cover-letter"
          id="native-apply-cover-letter"
          name="cover_letter"
          minLength={40}
          aria-describedby="native-apply-cover-hint"
          aria-errormessage="native-apply-cover-error"
          value={formState.coverLetter}
          onChange={updateField("coverLetter")}
          placeholder="Why you are a good fit for this role"
          required
        />
        <span id="native-apply-cover-error" className="field-error-msg">
          <span aria-hidden="true">⚠ </span>Cover letter must be at least 40 characters.
        </span>
      </div>

      {error ? (
        <p className="native-form-message native-form-error" role="alert">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="native-form-message native-form-success" role="status" aria-live="polite">
          <span aria-hidden="true">✓ </span>
          {success}
        </p>
      ) : null}

      <button className="shell-button native-submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
