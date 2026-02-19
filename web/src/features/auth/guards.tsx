import { type ReactNode, useEffect, useRef, useState } from "react";
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

/**
 * Revalidates roles on route changes and when the tab becomes active again.
 * Critically: it does NOT force a blocking "Checking..." UI once the user is already present,
 * because that would remount guarded routes and wipe in-progress form state.
 */
function useRoleGuardRevalidation(enabled: boolean, routeKey: string): boolean {
  const { revalidateRoles } = useSession();
  const [isRouteChecking, setIsRouteChecking] = useState(false);

  // Block only on the first authenticated check after mount; after that, background-only.
  const firstBlockingRunRef = useRef(true);

  useEffect(() => {
    if (!enabled) {
      setIsRouteChecking(false);
      firstBlockingRunRef.current = true;
      return;
    }

    let isMounted = true;

    if (firstBlockingRunRef.current) {
      setIsRouteChecking(true);
    }

    void revalidateRoles().finally(() => {
      if (!isMounted) return;
      setIsRouteChecking(false);
      firstBlockingRunRef.current = false;
    });

    return () => {
      isMounted = false;
    };
  }, [enabled, routeKey, revalidateRoles]);

  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      // Background only (do not set isRouteChecking)
      void revalidateRoles();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Background only (do not set isRouteChecking)
        void revalidateRoles();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, revalidateRoles]);

  return isRouteChecking;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { user, isLoading } = useSession();
  const routeKey = `${location.pathname}${location.search}${location.hash}`;
  const isRouteChecking = useRoleGuardRevalidation(Boolean(user), routeKey);

  // Only show blocking UI when we DON'T have a user yet (true initial load).
  if (!user && (isLoading || isRouteChecking)) {
    return <GuardState title="Checking session" message="Loading your account details..." />;
  }

  if (!user) {
    return <Navigate to={toSigninUrl(location.pathname, location.search, location.hash)} replace />;
  }

  return <>{children}</>;
}

export function RequireRole({
  roles,
  children,
  fallback,
  allowAdminBypass = true,
}: RequireRoleProps) {
  const location = useLocation();
  const { user, roles: userRoles, hasRole, isLoading } = useSession();
  const routeKey = `${location.pathname}${location.search}${location.hash}`;
  const isRouteChecking = useRoleGuardRevalidation(Boolean(user), routeKey);

  // Only show blocking UI when we DON'T have a user yet (true initial load).
  if (!user && (isLoading || isRouteChecking)) {
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