export type NativeJobStatus = "draft" | "published" | "closed" | "archived";

export type NativeApplicationStatus =
  | "submitted"
  | "in_review"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

export type NativeJob = {
  id: string;
  organizationId: string | null;
  postedBy: string | null;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location: string | null;
  jobType: string | null;
  category: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  applyDeadline: string | null;
  status: NativeJobStatus | string;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type NativeJobApplicationInput = {
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  coverLetter: string;
  cvUrl?: string;
};

export type NativeJobCreateInput = {
  title: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  location?: string;
  jobType?: string;
  category?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  applyDeadline?: string | null;
  status?: NativeJobStatus;
  isPublic?: boolean;
  organizationId?: string | null;
};

export type NativeJobApplicationRecord = {
  id: string;
  jobId: string;
  candidateUserId: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  coverLetter: string;
  cvUrl: string | null;
  status: NativeApplicationStatus | string;
  submittedAt: string | null;
  updatedAt: string | null;
  jobTitle: string | null;
  jobPostedBy: string | null;
  jobOrganizationId: string | null;
};
