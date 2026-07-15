import type { DashboardRole } from "../features/auth/roles";

export type SiteNavPlacement = "header" | "mobile" | "footer";

export type SiteNavState = {
  isAuthenticated: boolean;
  roles: DashboardRole[];
};

type ActiveMatch = "exact" | "prefix" | "none";

// Per-param requirements layered onto path matching: a string value must be
// present and equal; null means the param must be absent.
type ActiveQuery = Record<string, string | null>;

type SiteNavDefinitionBase = {
  id: string;
  label: string;
  activeMatch?: ActiveMatch;
  activeQuery?: ActiveQuery;
  placements: SiteNavPlacement[];
  labelsByPlacement?: Partial<Record<SiteNavPlacement, string>>;
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
  requiredRolesAny?: DashboardRole[];
  isCta?: boolean;
};

type SiteNavInternalDefinition = SiteNavDefinitionBase & {
  kind: "internal";
  to: string;
};

type SiteNavExternalDefinition = SiteNavDefinitionBase & {
  kind: "external";
  href: string;
};

type SiteNavDefinition = SiteNavInternalDefinition | SiteNavExternalDefinition;

export type SiteNavInternalLink = {
  id: string;
  kind: "internal";
  label: string;
  to: string;
  activeMatch: ActiveMatch;
  activeQuery?: ActiveQuery;
  isCta?: boolean;
};

export type SiteNavExternalLink = {
  id: string;
  kind: "external";
  label: string;
  href: string;
  isCta?: boolean;
};

export type SiteNavLink = SiteNavInternalLink | SiteNavExternalLink;

const NAV_DEFINITIONS: SiteNavDefinition[] = [
  {
    id: "home",
    kind: "internal",
    label: "Home",
    to: "/",
    activeMatch: "exact",
    activeQuery: { source: null },
    placements: ["header", "mobile", "footer"],
  },
  {
    id: "jobs",
    kind: "internal",
    label: "Direct Apply",
    to: "/?source=direct",
    activeMatch: "exact",
    activeQuery: { source: "direct" },
    placements: ["header", "mobile", "footer"],
  },
  {
    id: "dashboard",
    kind: "internal",
    label: "Dashboard",
    to: "/dashboard",
    activeMatch: "prefix",
    placements: ["header", "mobile", "footer"],
    requiresAuth: true,
  },
  {
    id: "recruiter",
    kind: "internal",
    label: "Recruiter",
    to: "/recruiter",
    activeMatch: "prefix",
    placements: ["header", "mobile", "footer"],
    requiresAuth: true,
    requiredRolesAny: ["recruiter", "admin"],
  },
  {
    id: "mdcn",
    kind: "internal",
    label: "MDCN",
    to: "/mdcn",
    activeMatch: "prefix",
    placements: ["header", "mobile", "footer"],
    requiresAuth: true,
    requiredRolesAny: ["mdcn_official", "admin"],
  },
  {
    id: "admin",
    kind: "internal",
    label: "Admin",
    to: "/admin",
    activeMatch: "prefix",
    placements: ["header", "mobile", "footer"],
    requiresAuth: true,
    requiredRolesAny: ["admin"],
  },
  {
    id: "subscribe",
    kind: "internal",
    label: "Subscribe",
    to: "/subscribe",
    activeMatch: "exact",
    placements: ["header", "mobile", "footer"],
    labelsByPlacement: {
      footer: "Subscribe to Newsletter",
    },
    isCta: true,
  },
  {
    id: "about",
    kind: "internal",
    label: "About Us",
    to: "/about",
    activeMatch: "exact",
    placements: ["mobile", "footer"],
  },
  {
    id: "why-jobbermed",
    kind: "internal",
    label: "Why JobberMed",
    to: "/landing",
    activeMatch: "exact",
    placements: ["footer"],
  },
  {
    id: "privacy",
    kind: "internal",
    label: "Privacy Policy",
    to: "/privacy",
    activeMatch: "exact",
    placements: ["mobile", "footer"],
  },
  {
    id: "signin",
    kind: "internal",
    label: "Sign In",
    to: "/signin",
    activeMatch: "exact",
    placements: ["header", "mobile", "footer"],
    hideWhenAuth: true,
  },
  {
    id: "signup",
    kind: "internal",
    label: "Sign Up",
    to: "/signup",
    activeMatch: "exact",
    placements: ["header", "mobile", "footer"],
    hideWhenAuth: true,
  },
];

function hasAnyRole(roles: DashboardRole[], requiredRolesAny: DashboardRole[]): boolean {
  return requiredRolesAny.some((role) => roles.includes(role));
}

function isDefinitionVisible(definition: SiteNavDefinition, state: SiteNavState): boolean {
  if (definition.requiresAuth && !state.isAuthenticated) {
    return false;
  }

  if (definition.hideWhenAuth && state.isAuthenticated) {
    return false;
  }

  if (definition.requiredRolesAny && !hasAnyRole(state.roles, definition.requiredRolesAny)) {
    return false;
  }

  return true;
}

function toSiteNavLink(definition: SiteNavDefinition, placement: SiteNavPlacement): SiteNavLink {
  const label = definition.labelsByPlacement?.[placement] ?? definition.label;

  if (definition.kind === "external") {
    return {
      id: definition.id,
      kind: "external",
      label,
      href: definition.href,
      isCta: definition.isCta,
    };
  }

  return {
    id: definition.id,
    kind: "internal",
    label,
    to: definition.to,
    activeMatch: definition.activeMatch ?? "prefix",
    activeQuery: definition.activeQuery,
    isCta: definition.isCta,
  };
}

export function getSiteNavLinks(placement: SiteNavPlacement, state: SiteNavState): SiteNavLink[] {
  return NAV_DEFINITIONS.filter((definition) => {
    if (!definition.placements.includes(placement)) {
      return false;
    }

    return isDefinitionVisible(definition, state);
  }).map((definition) => toSiteNavLink(definition, placement));
}

export function getHomeMobilePrimaryLink(state: SiteNavState): SiteNavInternalLink {
  if (state.isAuthenticated) {
    return {
      id: "home-mobile-primary-dashboard",
      kind: "internal",
      label: "Dashboard",
      to: "/dashboard",
      activeMatch: "prefix",
    };
  }

  return {
    id: "home-mobile-primary-signin",
    kind: "internal",
    label: "Sign In",
    to: "/signin",
    activeMatch: "exact",
  };
}

export function getHomeMobileSignUpLink(state: SiteNavState): SiteNavInternalLink | null {
  if (state.isAuthenticated) {
    return null;
  }

  return {
    id: "home-mobile-signup",
    kind: "internal",
    label: "Sign Up",
    to: "/signup",
    activeMatch: "exact",
  };
}

function matchesActiveQuery(activeQuery: ActiveQuery | undefined, search: string): boolean {
  if (!activeQuery) {
    return true;
  }

  const params = new URLSearchParams(search);
  return Object.entries(activeQuery).every(([key, expected]) =>
    expected === null ? !params.has(key) : params.get(key) === expected,
  );
}

export function isSiteNavLinkActive(link: SiteNavLink, pathname: string, search: string = ""): boolean {
  if (link.kind !== "internal") {
    return false;
  }

  if (link.activeMatch === "none") {
    return false;
  }

  const [targetPath] = link.to.split("?");

  if (!matchesActiveQuery(link.activeQuery, search)) {
    return false;
  }

  if (link.activeMatch === "exact") {
    return pathname === targetPath;
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}
