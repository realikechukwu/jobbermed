import { getSupabaseClient } from "../../lib/supabase-client";
import type { NativeJob, NativeJobApplicationInput } from "./types";

type NativeJobRow = Record<string, unknown>;

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toString(value: unknown): string {
  return toOptionalString(value) ?? "";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|•|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value === 1;
  return false;
}

function mapNativeJobRow(row: NativeJobRow): NativeJob {
  return {
    id: toString(row.id),
    organizationId: toOptionalString(row.organization_id),
    postedBy: toOptionalString(row.posted_by),
    title: toString(row.title),
    description: toString(row.description),
    requirements: toStringArray(row.requirements),
    responsibilities: toStringArray(row.responsibilities),
    location: toOptionalString(row.location),
    jobType: toOptionalString(row.job_type),
    category: toOptionalString(row.category),
    salaryMin: toNumber(row.salary_min),
    salaryMax: toNumber(row.salary_max),
    currency: toOptionalString(row.currency),
    applyDeadline: toOptionalString(row.apply_deadline),
    status: toString(row.status),
    isPublic: toBoolean(row.is_public),
    publishedAt: toOptionalString(row.published_at),
    createdAt: toOptionalString(row.created_at),
  };
}

function normalizeApplicationInput(input: NativeJobApplicationInput): NativeJobApplicationInput {
  return {
    jobId: input.jobId.trim(),
    applicantName: input.applicantName.trim(),
    applicantEmail: input.applicantEmail.trim().toLowerCase(),
    applicantPhone: input.applicantPhone?.trim(),
    coverLetter: input.coverLetter.trim(),
    cvUrl: input.cvUrl?.trim(),
  };
}

export async function fetchPublishedNativeJobs(): Promise<NativeJob[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("native_jobs")
    .select(
      "id, organization_id, posted_by, title, description, requirements, responsibilities, location, job_type, category, salary_min, salary_max, currency, apply_deadline, status, is_public, published_at, created_at",
    )
    .eq("status", "published")
    .eq("is_public", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load native jobs.");
  }

  if (!Array.isArray(data)) return [];
  return data.map((row) => mapNativeJobRow((row as NativeJobRow) ?? {})).filter((job) => Boolean(job.id));
}

export async function fetchPublishedNativeJobById(jobId: string): Promise<NativeJob | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("native_jobs")
    .select(
      "id, organization_id, posted_by, title, description, requirements, responsibilities, location, job_type, category, salary_min, salary_max, currency, apply_deadline, status, is_public, published_at, created_at",
    )
    .eq("id", jobId)
    .eq("status", "published")
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load native job details.");
  }

  if (!data) return null;
  return mapNativeJobRow((data as NativeJobRow) ?? {});
}

export async function submitNativeJobApplication(input: NativeJobApplicationInput): Promise<void> {
  const supabase = getSupabaseClient();
  const normalized = normalizeApplicationInput(input);
  const { data: authData } = await supabase.auth.getUser();
  const candidateUserId = authData.user?.id;

  if (!candidateUserId) {
    throw new Error("Sign in to submit an application.");
  }

  const payload = {
    job_id: normalized.jobId,
    candidate_user_id: candidateUserId,
    applicant_name: normalized.applicantName,
    applicant_email: normalized.applicantEmail,
    applicant_phone: normalized.applicantPhone || null,
    cover_letter: normalized.coverLetter,
    cv_url: normalized.cvUrl || null,
    status: "submitted",
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("native_job_applications").insert(payload);

  if (error?.code === "23505") {
    throw new Error("Application already exists for this job and account.");
  }

  if (error) {
    throw new Error(error.message || "Unable to submit application.");
  }
}
