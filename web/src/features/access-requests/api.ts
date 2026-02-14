import { getSupabaseClient } from "../../lib/supabase-client";
import { normalizeRole } from "../auth/roles";

export type AccessRequestRole = "recruiter" | "mdcn_official";

export type AccessRequestStatus = "pending" | "approved" | "rejected";

export type AccessRequest = {
  id: string;
  userId: string;
  requestedRole: AccessRequestRole;
  orgId: string | null;
  reason: string | null;
  status: AccessRequestStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AccessRequestWithProfile = AccessRequest & {
  requesterName: string | null;
  requesterEmail: string | null;
};

type AccessRequestRow = Record<string, unknown>;

type ProfileRow = {
  user_id?: string;
  full_name?: string | null;
  email?: string | null;
};

function toOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toString(value: unknown): string {
  return toOptionalString(value) ?? "";
}

function normalizeRequestRole(value: unknown): AccessRequestRole {
  const role = normalizeRole(value);
  return role === "mdcn_official" ? "mdcn_official" : "recruiter";
}

function normalizeRequestStatus(value: unknown): AccessRequestStatus {
  if (value === "approved" || value === "rejected") {
    return value;
  }
  return "pending";
}

function mapAccessRequestRow(row: AccessRequestRow): AccessRequest {
  return {
    id: toString(row.id),
    userId: toString(row.user_id),
    requestedRole: normalizeRequestRole(row.requested_role),
    orgId: toOptionalString(row.org_id),
    reason: toOptionalString(row.reason),
    status: normalizeRequestStatus(row.status),
    reviewedBy: toOptionalString(row.reviewed_by),
    reviewedAt: toOptionalString(row.reviewed_at),
    createdAt: toOptionalString(row.created_at),
    updatedAt: toOptionalString(row.updated_at),
  };
}

async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message || "Unable to resolve current user.");
  }

  if (!user) {
    throw new Error("Sign in required.");
  }

  return user.id;
}

export async function fetchMyAccessRequests(requestedRole?: AccessRequestRole): Promise<AccessRequest[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("access_requests")
    .select("id,user_id,requested_role,org_id,reason,status,reviewed_by,reviewed_at,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (requestedRole) {
    query = query.eq("requested_role", requestedRole);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Unable to load access requests.");
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => mapAccessRequestRow((row as AccessRequestRow) ?? {}))
    .filter((row) => Boolean(row.id));
}

export async function createAccessRequest(input: {
  requestedRole: AccessRequestRole;
  reason?: string;
  orgId?: string | null;
}): Promise<AccessRequest> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  const { data: pendingData, error: pendingError } = await supabase
    .from("access_requests")
    .select("id,status")
    .eq("user_id", userId)
    .eq("requested_role", input.requestedRole)
    .eq("status", "pending")
    .limit(1);

  if (pendingError) {
    throw new Error(pendingError.message || "Unable to validate pending requests.");
  }

  if (Array.isArray(pendingData) && pendingData.length > 0) {
    throw new Error("An access request for this role is already pending.");
  }

  const payload = {
    user_id: userId,
    requested_role: input.requestedRole,
    org_id: input.orgId ?? null,
    reason: input.reason?.trim() || null,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("access_requests")
    .insert(payload)
    .select("id,user_id,requested_role,org_id,reason,status,reviewed_by,reviewed_at,created_at,updated_at")
    .single();

  if (error) {
    throw new Error(error.message || "Unable to submit access request.");
  }

  return mapAccessRequestRow((data as AccessRequestRow) ?? {});
}

export async function fetchPendingAccessRequestsForAdmin(): Promise<AccessRequestWithProfile[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("access_requests")
    .select("id,user_id,requested_role,org_id,reason,status,reviewed_by,reviewed_at,created_at,updated_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Unable to load pending requests.");
  }

  const requests = (Array.isArray(data) ? data : [])
    .map((row) => mapAccessRequestRow((row as AccessRequestRow) ?? {}))
    .filter((row) => Boolean(row.id));

  const userIds = [...new Set(requests.map((request) => request.userId).filter(Boolean))];

  if (userIds.length === 0) {
    return requests.map((request) => ({
      ...request,
      requesterName: null,
      requesterEmail: null,
    }));
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id,full_name,email")
    .in("user_id", userIds);

  if (profilesError) {
    throw new Error(profilesError.message || "Unable to load requester profiles.");
  }

  const profiles = new Map<string, { fullName: string | null; email: string | null }>();

  for (const row of Array.isArray(profilesData) ? profilesData : []) {
    const profileRow = (row ?? {}) as ProfileRow;
    const userId = toOptionalString(profileRow.user_id);
    if (!userId) continue;
    profiles.set(userId, {
      fullName: toOptionalString(profileRow.full_name),
      email: toOptionalString(profileRow.email),
    });
  }

  return requests.map((request) => {
    const profile = profiles.get(request.userId);
    return {
      ...request,
      requesterName: profile?.fullName ?? null,
      requesterEmail: profile?.email ?? null,
    };
  });
}

export async function reviewAccessRequest(requestId: string, approve: boolean): Promise<AccessRequest> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("approve_access_request", {
    p_request_id: requestId,
    p_approve: approve,
  });

  if (!error) {
    const row = Array.isArray(data) ? data[0] : data;
    return mapAccessRequestRow((row as AccessRequestRow) ?? {});
  }

  throw new Error(
    error.message || "Unable to review access request. Confirm approve_access_request RPC is available.",
  );
}
