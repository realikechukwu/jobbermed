import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { CardPrimitive } from "../../components/CardPrimitive";
import { RouteShell } from "../../layouts/RouteShell";
import { type DashboardRole } from "./roles";
import { useSession } from "./session-context";

type RequireAuthProps = {
  children: ReactNode;
};

type RequireRoleProps = {
  roles: DashboardRole[];
  children: ReactNode;
  fallback?: ReactNode;
  allowAdminBypass?: boolean;
};

function GuardState({ title, message }: { title: string; message: string }) {
  return (
    <RouteShell title={title} subtitle="Dashboard access is being validated.">
      <section className="shell-content" aria-label="Access guard state">
        <CardPrimitive title={title}>
          <p className="meta">{message}</p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}

function toSigninUrl(pathname: string, search: string, hash: string): string {
  const next = `${pathname}${search}${hash}`;
  return `/signin?next=${encodeURIComponent(next)}`;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { user, isLoading } = useSession();

  if (isLoading) {
    return <GuardState title="Checking session" message="Loading your account details..." />;
  }

  if (!user) {
    return <Navigate to={toSigninUrl(location.pathname, location.search, location.hash)} replace />;
  }

  return <>{children}</>;
}

export function RequireRole({ roles, children, fallback, allowAdminBypass = true }: RequireRoleProps) {
  const location = useLocation();
  const { user, roles: userRoles, hasRole, isLoading } = useSession();

  if (isLoading) {
    return <GuardState title="Checking permissions" message="Validating your role access..." />;
  }

  if (!user) {
    return <Navigate to={toSigninUrl(location.pathname, location.search, location.hash)} replace />;
  }

  const canAccessRole = roles.some((role) => hasRole(role));
  const isAdminBypass = allowAdminBypass && hasRole("admin");

  if (canAccessRole || isAdminBypass) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const currentRoles = userRoles.join(", ") || "candidate";

  return (
    <GuardState
      title="Access denied"
      message={`Your account roles (${currentRoles}) do not permit this page.`}
    />
  );
}
