import { getSupabaseClient } from "../../lib/supabase-client";
import type {
  NativeApplicationStatus,
  NativeJob,
  NativeJobApplicationInput,
  NativeJobApplicationRecord,
  NativeJobCreateInput,
  NativeJobStatus,
} from "./types";

type NativeJobRow = Record<string, unknown>;

type NativeJobApplicationRow = Record<string, unknown>;

const NATIVE_JOB_SELECT =
  "id,organization_id,posted_by,title,description,requirements,responsibilities,location,job_type,category,salary_min,salary_max,currency,apply_deadline,status,is_public,published_at,created_at,updated_at";

const NATIVE_JOB_APPLICATION_SELECT =
  "id,job_id,candidate_user_id,applicant_name,applicant_email,applicant_phone,cover_letter,cv_url,status,submitted_at,updated_at,native_jobs(title,posted_by,organization_id)";

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

function serializeList(value: string[] | undefined): string | null {
  if (!Array.isArray(value)) return null;
  const clean = value.map((item) => item.trim()).filter(Boolean);
  if (clean.length === 0) return null;
  return clean.join("\n");
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
    status: toString(row.status) as NativeJobStatus | string,
    isPublic: toBoolean(row.is_public),
    publishedAt: toOptionalString(row.published_at),
    createdAt: toOptionalString(row.created_at),
    updatedAt: toOptionalString(row.updated_at),
  };
}

function mapNativeJobApplicationRow(row: NativeJobApplicationRow): NativeJobApplicationRecord {
  const jobDataRaw = row.native_jobs;
  const jobData =
    typeof jobDataRaw === "object" && jobDataRaw !== null && !Array.isArray(jobDataRaw)
      ? (jobDataRaw as NativeJobRow)
      : null;

  return {
    id: toString(row.id),
    jobId: toString(row.job_id),
    candidateUserId: toOptionalString(row.candidate_user_id),
    applicantName: toString(row.applicant_name),
    applicantEmail: toString(row.applicant_email),
    applicantPhone: toOptionalString(row.applicant_phone),
    coverLetter: toString(row.cover_letter),
    cvUrl: toOptionalString(row.cv_url),
    status: toString(row.status) as NativeApplicationStatus | string,
    submittedAt: toOptionalString(row.submitted_at),
    updatedAt: toOptionalString(row.updated_at),
    jobTitle: toOptionalString(jobData?.title),
    jobPostedBy: toOptionalString(jobData?.posted_by),
    jobOrganizationId: toOptionalString(jobData?.organization_id),
  };
}

async function requireAuthUserId() {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message || "Unable to read account.");
  }

  if (!user) {
    throw new Error("Sign in required.");
  }

  return user.id;
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
    .select(NATIVE_JOB_SELECT)
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
    .select(NATIVE_JOB_SELECT)
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

export async function fetchNativeJobByIdForManager(jobId: string): Promise<NativeJob | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("native_jobs")
    .select(NATIVE_JOB_SELECT)
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load this job.");
  }

  if (!data) return null;
  return mapNativeJobRow((data as NativeJobRow) ?? {});
}

export async function fetchMyNativeJobs(): Promise<NativeJob[]> {
  const supabase = getSupabaseClient();
  const userId = await requireAuthUserId();

  const { data, error } = await supabase
    .from("native_jobs")
    .select(NATIVE_JOB_SELECT)
    .eq("posted_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load your native jobs.");
  }

  if (!Array.isArray(data)) return [];
  return data.map((row) => mapNativeJobRow((row as NativeJobRow) ?? {})).filter((job) => Boolean(job.id));
}

export async function createNativeJob(input: NativeJobCreateInput): Promise<NativeJob> {
  const supabase = getSupabaseClient();
  const userId = await requireAuthUserId();

  const status = input.status ?? "draft";
  const isPublic = input.isPublic ?? true;
  const nowIso = new Date().toISOString();

  const payload = {
    organization_id: input.organizationId ?? null,
    posted_by: userId,
    title: input.title.trim(),
    description: input.description.trim(),
    requirements: serializeList(input.requirements),
    responsibilities: serializeList(input.responsibilities),
    location: input.location?.trim() || null,
    job_type: input.jobType?.trim() || null,
    category: input.category?.trim() || null,
    salary_min: input.salaryMin ?? null,
    salary_max: input.salaryMax ?? null,
    currency: input.currency?.trim() || "NGN",
    apply_deadline: input.applyDeadline || null,
    status,
    is_public: isPublic,
    published_at: status === "published" ? nowIso : null,
  };

  const { data, error } = await supabase.from("native_jobs").insert(payload).select(NATIVE_JOB_SELECT).single();

  if (error) {
    throw new Error(error.message || "Unable to create native job.");
  }

  return mapNativeJobRow((data as NativeJobRow) ?? {});
}

export async function submitNativeJobApplication(input: NativeJobApplicationInput): Promise<void> {
  const supabase = getSupabaseClient();
  const normalized = normalizeApplicationInput(input);
  const candidateUserId = await requireAuthUserId();

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

export async function fetchCandidateNativeApplications(): Promise<NativeJobApplicationRecord[]> {
  const supabase = getSupabaseClient();
  const userId = await requireAuthUserId();

  const { data, error } = await supabase
    .from("native_job_applications")
    .select(NATIVE_JOB_APPLICATION_SELECT)
    .eq("candidate_user_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load your applications.");
  }

  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapNativeJobApplicationRow((row as NativeJobApplicationRow) ?? {}))
    .filter((application) => Boolean(application.id));
}

export async function fetchNativeJobApplicants(jobId: string): Promise<NativeJobApplicationRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("native_job_applications")
    .select(NATIVE_JOB_APPLICATION_SELECT)
    .eq("job_id", jobId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load applicants for this job.");
  }

  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapNativeJobApplicationRow((row as NativeJobApplicationRow) ?? {}))
    .filter((application) => Boolean(application.id));
}

export async function fetchReviewerNativeApplications(limit = 120): Promise<NativeJobApplicationRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("native_job_applications")
    .select(NATIVE_JOB_APPLICATION_SELECT)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Unable to load review queue.");
  }

  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapNativeJobApplicationRow((row as NativeJobApplicationRow) ?? {}))
    .filter((application) => Boolean(application.id));
}

export async function updateNativeApplicationStatus(
  applicationId: string,
  status: NativeApplicationStatus,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("native_job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    throw new Error(error.message || "Unable to update application status.");
  }
}
