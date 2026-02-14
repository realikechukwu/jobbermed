export type DashboardRole = "candidate" | "recruiter" | "mdcn_official" | "admin";

export function normalizeRole(value: unknown): DashboardRole | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();

  if (!normalized) return null;

  if (normalized === "candidate" || normalized === "user") {
    return "candidate";
  }

  if (normalized === "recruiter" || normalized === "employer") {
    return "recruiter";
  }

  if (normalized === "mdcn" || normalized === "mdcn_official") {
    return "mdcn_official";
  }

  if (normalized === "admin" || normalized === "platform_admin") {
    return "admin";
  }

  return null;
}

function asRoleList(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

export function deriveClaimRoles(claims: {
  appRole?: unknown;
  appRoles?: unknown;
  userRole?: unknown;
  userRoles?: unknown;
}): DashboardRole[] {
  const roles = new Set<DashboardRole>();
  const candidates = [
    ...asRoleList(claims.appRoles),
    ...asRoleList(claims.userRoles),
    ...asRoleList(claims.appRole),
    ...asRoleList(claims.userRole),
  ];

  for (const candidate of candidates) {
    const role = normalizeRole(candidate);
    if (role) {
      roles.add(role);
    }
  }

  return [...roles];
}

export function mergeRoles(base: DashboardRole[], extra: DashboardRole[]): DashboardRole[] {
  const roles = new Set<DashboardRole>([...base, ...extra]);
  return [...roles];
}

export function hasRole(roles: DashboardRole[], expected: DashboardRole): boolean {
  return roles.includes(expected);
}
