import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase-client";
import {
  deriveClaimRoles,
  type DashboardRole,
  hasRole as hasRoleUtil,
  mergeRoles,
  normalizeRole,
} from "./roles";

type SessionContextValue = {
  session: Session | null;
  user: User | null;
  roles: DashboardRole[];
  isLoading: boolean;
  isRevalidatingRoles: boolean;
  error: string | null;
  hasRole: (role: DashboardRole) => boolean;
  refresh: () => Promise<void>;
  revalidateRoles: () => Promise<void>;
};

type UserPlatformRoleRow = {
  role?: unknown;
  status?: unknown;
  is_active?: unknown;
};

type HydrateOptions = {
  blockUi?: boolean;
  preserveRolesOnError?: boolean;
  event?: string;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const IGNORABLE_ROLE_QUERY_CODES = new Set(["42P01", "42703", "42501"]);

function isRoleActive(row: UserPlatformRoleRow): boolean {
  const status =
    typeof row.status === "string" ? row.status.toLowerCase() : "active";
  const isActive =
    typeof row.is_active === "boolean" ? row.is_active : true;
  return isActive && status === "active";
}

async function resolveRoles(user: User): Promise<DashboardRole[]> {
  const supabase = getSupabaseClient();
  let roles: DashboardRole[] = ["candidate"];

  const claimRoles = deriveClaimRoles({
    appRole: user.app_metadata?.role,
    appRoles: user.app_metadata?.roles,
    userRole: user.user_metadata?.role,
    userRoles: user.user_metadata?.roles,
  });

  roles = mergeRoles(roles, claimRoles);

  const { data, error } = await supabase
    .from("user_platform_roles")
    .select("role,status,is_active")
    .eq("user_id", user.id);

  if (error) {
    if (!IGNORABLE_ROLE_QUERY_CODES.has(error.code || "")) {
      throw new Error(error.message || "Unable to load role assignments.");
    }
    return roles;
  }

  const roleRows = (Array.isArray(data) ? data : []) as UserPlatformRoleRow[];

  const dbRoles = roleRows
    .filter((row) => isRoleActive(row))
    .map((row) => normalizeRole(row.role))
    .filter((role): role is DashboardRole => role !== null);

  return mergeRoles(roles, dbRoles);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<DashboardRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevalidatingRoles, setIsRevalidatingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  const hydrate = useCallback(
    async (nextSession: Session | null, options?: HydrateOptions) => {
      const blockUi = options?.blockUi ?? !hasInitializedRef.current;
      const preserveRolesOnError = options?.preserveRolesOnError ?? !blockUi;
      const authEvent = options?.event;

      if (blockUi) {
        setIsLoading(true);
      }

      setError(null);

      // 🚨 KEY FIX: Only clear state on explicit SIGNED_OUT
      if (!nextSession?.user) {
        if (authEvent !== "SIGNED_OUT") {
          // Transient null during tab focus / token refresh → ignore
          return;
        }

        if (!mountedRef.current) return;

        setSession(null);
        setUser(null);
        setRoles([]);
        setIsRevalidatingRoles(false);
        setIsLoading(false);
        hasInitializedRef.current = true;
        return;
      }

      try {
        const resolvedRoles = await resolveRoles(nextSession.user);
        if (!mountedRef.current) return;

        setSession(nextSession);
        setUser(nextSession.user);
        setRoles(resolvedRoles);
      } catch (loadError) {
        if (!mountedRef.current) return;

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to initialize session.";

        setSession(nextSession);
        setUser(nextSession.user);

        if (!preserveRolesOnError) {
          setRoles(["candidate"]);
        }

        setError(message);
      } finally {
        if (mountedRef.current && blockUi) {
          setIsLoading(false);
        }
        hasInitializedRef.current = true;
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      if (!mountedRef.current) return;
      setError(sessionError.message || "Unable to refresh session.");
      return;
    }

    await hydrate(data.session ?? null, {
      blockUi: false,
      preserveRolesOnError: true,
    });
  }, [hydrate]);

  const revalidateRoles = useCallback(async () => {
    if (!user) return;

    setIsRevalidatingRoles(true);

    try {
      const resolvedRoles = await resolveRoles(user);
      if (!mountedRef.current) return;
      setRoles(resolvedRoles);
      setError(null);
    } catch (roleError) {
      if (!mountedRef.current) return;
      const message =
        roleError instanceof Error
          ? roleError.message
          : "Unable to revalidate roles.";
      setError(message);
    } finally {
      if (mountedRef.current) {
        setIsRevalidatingRoles(false);
      }
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = getSupabaseClient();

    const bootstrap = async () => {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError && mountedRef.current) {
        setError(
          sessionError.message || "Unable to initialize session.",
        );
      }

      await hydrate(data.session ?? null, {
        blockUi: true,
        preserveRolesOnError: false,
      });
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void hydrate(nextSession, {
        blockUi: false,
        preserveRolesOnError: true,
        event,
      });
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [hydrate]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      user,
      roles,
      isLoading,
      isRevalidatingRoles,
      error,
      hasRole: (role: DashboardRole) => hasRoleUtil(roles, role),
      refresh,
      revalidateRoles,
    }),
    [
      error,
      isLoading,
      isRevalidatingRoles,
      refresh,
      revalidateRoles,
      roles,
      session,
      user,
    ],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider.");
  }
  return context;
}