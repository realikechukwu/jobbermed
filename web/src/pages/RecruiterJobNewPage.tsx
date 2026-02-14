import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { createNativeJob } from "../features/native-jobs/api";
import type { NativeJobStatus } from "../features/native-jobs/types";
import { RouteShell } from "../layouts/RouteShell";

type JobFormState = {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  jobType: string;
  category: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  applyDeadline: string;
  status: NativeJobStatus;
  isPublic: boolean;
};

const initialState: JobFormState = {
  title: "",
  description: "",
  requirements: "",
  responsibilities: "",
  location: "",
  jobType: "",
  category: "",
  salaryMin: "",
  salaryMax: "",
  currency: "NGN",
  applyDeadline: "",
  status: "published",
  isPublic: true,
};

function toList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function RecruiterJobNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<JobFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof JobFormState>(field: K, value: JobFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.title.trim().length < 3) {
      setError("Job title must be at least 3 characters.");
      return;
    }

    if (form.description.trim().length < 40) {
      setError("Description should be at least 40 characters.");
      return;
    }

    const salaryMin = toNullableNumber(form.salaryMin);
    const salaryMax = toNullableNumber(form.salaryMax);

    if (form.salaryMin.trim() && salaryMin === null) {
      setError("Minimum salary must be a valid number.");
      return;
    }

    if (form.salaryMax.trim() && salaryMax === null) {
      setError("Maximum salary must be a valid number.");
      return;
    }

    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      setError("Minimum salary cannot exceed maximum salary.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdJob = await createNativeJob({
        title: form.title,
        description: form.description,
        requirements: toList(form.requirements),
        responsibilities: toList(form.responsibilities),
        location: form.location,
        jobType: form.jobType,
        category: form.category,
        salaryMin,
        salaryMax,
        currency: form.currency,
        applyDeadline: form.applyDeadline || null,
        status: form.status,
        isPublic: form.isPublic,
      });

      navigate(`/recruiter/jobs/${createdJob.id}/applicants`, { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to create native job.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RouteShell title="Post native job" subtitle="Create a direct-apply listing for candidates.">
      <section className="shell-content" aria-label="Create native job">
        <CardPrimitive title="New native job">
          <form className="shell-form" onSubmit={handleSubmit}>
            <label className="shell-label" htmlFor="job-title">
              Job title
            </label>
            <input
              className="shell-input"
              id="job-title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              required
            />

            <label className="shell-label" htmlFor="job-description">
              Description
            </label>
            <textarea
              className="shell-input access-request-reason"
              id="job-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              required
            />

            <label className="shell-label" htmlFor="job-requirements">
              Requirements (one per line)
            </label>
            <textarea
              className="shell-input access-request-reason"
              id="job-requirements"
              value={form.requirements}
              onChange={(event) => update("requirements", event.target.value)}
            />

            <label className="shell-label" htmlFor="job-responsibilities">
              Responsibilities (one per line)
            </label>
            <textarea
              className="shell-input access-request-reason"
              id="job-responsibilities"
              value={form.responsibilities}
              onChange={(event) => update("responsibilities", event.target.value)}
            />

            <div className="dashboard-form-grid">
              <div>
                <label className="shell-label" htmlFor="job-location">
                  Location
                </label>
                <input
                  className="shell-input"
                  id="job-location"
                  value={form.location}
                  onChange={(event) => update("location", event.target.value)}
                />
              </div>

              <div>
                <label className="shell-label" htmlFor="job-type">
                  Job type
                </label>
                <input
                  className="shell-input"
                  id="job-type"
                  value={form.jobType}
                  onChange={(event) => update("jobType", event.target.value)}
                />
              </div>

              <div>
                <label className="shell-label" htmlFor="job-category">
                  Category
                </label>
                <input
                  className="shell-input"
                  id="job-category"
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                />
              </div>

              <div>
                <label className="shell-label" htmlFor="job-currency">
                  Currency
                </label>
                <input
                  className="shell-input"
                  id="job-currency"
                  value={form.currency}
                  onChange={(event) => update("currency", event.target.value)}
                />
              </div>

              <div>
                <label className="shell-label" htmlFor="job-salary-min">
                  Salary min
                </label>
                <input
                  className="shell-input"
                  id="job-salary-min"
                  type="number"
                  value={form.salaryMin}
                  onChange={(event) => update("salaryMin", event.target.value)}
                />
              </div>

              <div>
                <label className="shell-label" htmlFor="job-salary-max">
                  Salary max
                </label>
                <input
                  className="shell-input"
                  id="job-salary-max"
                  type="number"
                  value={form.salaryMax}
                  onChange={(event) => update("salaryMax", event.target.value)}
                />
              </div>

              <div>
                <label className="shell-label" htmlFor="job-deadline">
                  Apply deadline
                </label>
                <input
                  className="shell-input"
                  id="job-deadline"
                  type="date"
                  value={form.applyDeadline}
                  onChange={(event) => update("applyDeadline", event.target.value)}
                />
              </div>

              <div>
                <label className="shell-label" htmlFor="job-status">
                  Initial status
                </label>
                <select
                  className="shell-input"
                  id="job-status"
                  value={form.status}
                  onChange={(event) => update("status", event.target.value as NativeJobStatus)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <label className="shell-label dashboard-checkbox">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(event) => update("isPublic", event.target.checked)}
              />
              <span>Make this job publicly visible</span>
            </label>

            {error ? <p className="native-form-message native-form-error">{error}</p> : null}

            <button className="shell-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create job"}
            </button>
          </form>

          <p className="meta auth-aux-link">
            <Link to="/recruiter">Back to recruiter dashboard</Link>
          </p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
