import type { DashboardRole } from "../features/auth/roles";

export type SiteNavPlacement = "header" | "mobile" | "footer";

export type SiteNavState = {
  isAuthenticated: boolean;
  roles: DashboardRole[];
};

type ActiveMatch = "exact" | "prefix" | "none";

export type SiteNavGroup = "primary" | "account" | "legal" | "auth";

// Per-param requirements layered onto path matching: a string value must be
// present and equal; null means the param must be absent.
type ActiveQuery = Record<string, string | null>;

type SiteNavDefinitionBase = {
  id: string;
  label: string;
  group: SiteNavGroup;
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
  group: SiteNavGroup;
  to: string;
  activeMatch: ActiveMatch;
  activeQuery?: ActiveQuery;
  isCta?: boolean;
};

export type SiteNavExternalLink = {
  id: string;
  kind: "external";
  label: string;
  group: SiteNavGroup;
  href: string;
  isCta?: boolean;
};

export type SiteNavLink = SiteNavInternalLink | SiteNavExternalLink;

const NAV_DEFINITIONS: SiteNavDefinition[] = [
  {
    id: "home",
    kind: "internal",
    label: "Home",
    group: "primary",
    to: "/",
    activeMatch: "exact",
    activeQuery: { source: null },
    placements: ["header", "mobile", "footer"],
  },
  {
    id: "jobs",
    kind: "internal",
    label: "Direct Apply",
    group: "primary",
    to: "/?source=direct",
    activeMatch: "exact",
    activeQuery: { source: "direct" },
    placements: ["header", "mobile", "footer"],
  },
  {
    id: "dashboard",
    kind: "internal",
    label: "Dashboard",
    group: "account",
    to: "/dashboard",
    activeMatch: "prefix",
    placements: ["header", "mobile", "footer"],
    requiresAuth: true,
  },
  {
    id: "recruiter",
    kind: "internal",
    label: "Recruiter",
    group: "account",
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
    group: "account",
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
    group: "account",
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
    group: "primary",
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
    group: "legal",
    to: "/about",
    activeMatch: "exact",
    placements: ["mobile", "footer"],
  },
  {
    id: "why-jobbermed",
    kind: "internal",
    label: "Why JobberMed",
    group: "legal",
    to: "/landing",
    activeMatch: "exact",
    placements: ["mobile", "footer"],
  },
  {
    id: "privacy",
    kind: "internal",
    label: "Privacy Policy",
    group: "legal",
    to: "/privacy",
    activeMatch: "exact",
    placements: ["mobile", "footer"],
  },
  {
    id: "contact",
    kind: "external",
    label: "Contact Us",
    group: "legal",
    href: "mailto:hello@jobbermed.com",
    placements: ["mobile", "footer"],
  },
  {
    id: "signin",
    kind: "internal",
    label: "Sign In",
    group: "auth",
    to: "/signin",
    activeMatch: "exact",
    placements: ["header", "mobile", "footer"],
    hideWhenAuth: true,
  },
  {
    id: "signup",
    kind: "internal",
    label: "Sign Up",
    group: "auth",
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
      group: definition.group,
      href: definition.href,
      isCta: definition.isCta,
    };
  }

  return {
    id: definition.id,
    kind: "internal",
    label,
    group: definition.group,
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
