import { type ChangeEvent, type FormEvent, useState } from "react";
import { submitNativeJobApplication } from "../api";

type NativeJobApplyFormProps = {
  jobId: string;
  jobTitle: string;
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

export function NativeJobApplyForm({ jobId, jobTitle }: NativeJobApplyFormProps) {
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
      setError("CV link must be a valid http or https URL.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitNativeJobApplication({
        jobId,
        applicantName,
        applicantEmail,
        applicantPhone,
        coverLetter,
        cvUrl,
      });
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
      <label className="shell-label" htmlFor="native-apply-name">
        Full name
      </label>
      <input
        className="shell-input"
        id="native-apply-name"
        value={formState.applicantName}
        onChange={updateField("applicantName")}
        placeholder="Your full name"
        required
      />

      <label className="shell-label" htmlFor="native-apply-email">
        Email
      </label>
      <input
        className="shell-input"
        id="native-apply-email"
        type="email"
        value={formState.applicantEmail}
        onChange={updateField("applicantEmail")}
        placeholder="you@example.com"
        required
      />

      <label className="shell-label" htmlFor="native-apply-phone">
        Phone
      </label>
      <input
        className="shell-input"
        id="native-apply-phone"
        type="tel"
        value={formState.applicantPhone}
        onChange={updateField("applicantPhone")}
        placeholder="+234..."
      />

      <label className="shell-label" htmlFor="native-apply-cv">
        CV link (optional)
      </label>
      <input
        className="shell-input"
        id="native-apply-cv"
        type="url"
        value={formState.cvUrl}
        onChange={updateField("cvUrl")}
        placeholder="https://..."
      />

      <label className="shell-label" htmlFor="native-apply-cover-letter">
        Cover letter
      </label>
      <textarea
        className="shell-input native-apply-cover-letter"
        id="native-apply-cover-letter"
        value={formState.coverLetter}
        onChange={updateField("coverLetter")}
        placeholder="Why you are a good fit for this role"
        required
      />

      {error ? <p className="native-form-message native-form-error">{error}</p> : null}
      {success ? <p className="native-form-message native-form-success">{success}</p> : null}

      <button className="shell-button native-submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
