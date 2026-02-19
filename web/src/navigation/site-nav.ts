import type { DashboardRole } from "../features/auth/roles";

export type SiteNavContext = "home" | "app";
export type SiteNavPlacement = "header" | "mobile" | "footer";

export type SiteNavState = {
  isAuthenticated: boolean;
  roles: DashboardRole[];
};

type ContextPlacementKey = `${SiteNavContext}_${SiteNavPlacement}`;

type ActiveMatch = "exact" | "prefix" | "none";

type SiteNavDefinitionBase = {
  id: string;
  label: string;
  activeMatch?: ActiveMatch;
  contexts: SiteNavContext[];
  placements: SiteNavPlacement[];
  labelsByPlacement?: Partial<Record<ContextPlacementKey, string>>;
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
  requiredRolesAny?: DashboardRole[];
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
};

export type SiteNavExternalLink = {
  id: string;
  kind: "external";
  label: string;
  href: string;
};

export type SiteNavLink = SiteNavInternalLink | SiteNavExternalLink;

const NAV_DEFINITIONS: SiteNavDefinition[] = [
  {
    id: "home",
    kind: "internal",
    label: "Home",
    to: "/",
    activeMatch: "exact",
    contexts: ["home", "app"],
    placements: ["header", "mobile", "footer"],
  },
  {
    id: "jobs",
    kind: "internal",
    label: "Native Jobs",
    to: "/native-jobs",
    activeMatch: "prefix",
    contexts: ["home", "app"],
    placements: ["header", "mobile", "footer"],
  },
  {
    id: "subscribe",
    kind: "internal",
    label: "Subscribe",
    to: "/subscribe",
    activeMatch: "exact",
    contexts: ["home", "app"],
    placements: ["header", "mobile", "footer"],
    labelsByPlacement: {
      home_footer: "Subscribe to Newsletter",
      app_footer: "Subscribe to Newsletter",
    },
  },
  {
    id: "dashboard",
    kind: "internal",
    label: "Dashboard",
    to: "/dashboard",
    activeMatch: "prefix",
    contexts: ["home", "app"],
    placements: ["header", "mobile", "footer"],
    requiresAuth: true,
  },
  {
    id: "recruiter",
    kind: "internal",
    label: "Recruiter",
    to: "/recruiter",
    activeMatch: "prefix",
    contexts: ["app"],
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
    contexts: ["app"],
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
    contexts: ["app"],
    placements: ["header", "mobile", "footer"],
    requiresAuth: true,
    requiredRolesAny: ["admin"],
  },
  {
    id: "about",
    kind: "internal",
    label: "About Us",
    to: "/about",
    activeMatch: "exact",
    contexts: ["home", "app"],
    placements: ["header", "mobile", "footer"],
  },
  {
    id: "privacy",
    kind: "internal",
    label: "Privacy Policy",
    to: "/privacy",
    activeMatch: "exact",
    contexts: ["home", "app"],
    placements: ["header", "mobile", "footer"],
  },
  {
    id: "signin",
    kind: "internal",
    label: "Sign In",
    to: "/signin",
    activeMatch: "exact",
    contexts: ["app"],
    placements: ["header", "mobile", "footer"],
    hideWhenAuth: true,
  },
  {
    id: "signup-app",
    kind: "internal",
    label: "Sign Up",
    to: "/signup",
    activeMatch: "exact",
    contexts: ["app"],
    placements: ["header", "mobile", "footer"],
    hideWhenAuth: true,
  },
  {
    id: "signup-home",
    kind: "internal",
    label: "Sign Up",
    to: "/signup",
    activeMatch: "exact",
    contexts: ["home"],
    placements: ["footer"],
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

function resolveLabel(definition: SiteNavDefinition, context: SiteNavContext, placement: SiteNavPlacement): string {
  const key = `${context}_${placement}` as ContextPlacementKey;
  return definition.labelsByPlacement?.[key] ?? definition.label;
}

function toSiteNavLink(definition: SiteNavDefinition, context: SiteNavContext, placement: SiteNavPlacement): SiteNavLink {
  const label = resolveLabel(definition, context, placement);

  if (definition.kind === "external") {
    return {
      id: definition.id,
      kind: "external",
      label,
      href: definition.href,
    };
  }

  return {
    id: definition.id,
    kind: "internal",
    label,
    to: definition.to,
    activeMatch: definition.activeMatch ?? "prefix",
  };
}

export function getSiteNavLinks(context: SiteNavContext, placement: SiteNavPlacement, state: SiteNavState): SiteNavLink[] {
  return NAV_DEFINITIONS.filter((definition) => {
    if (!definition.contexts.includes(context)) {
      return false;
    }

    if (!definition.placements.includes(placement)) {
      return false;
    }

    return isDefinitionVisible(definition, state);
  }).map((definition) => toSiteNavLink(definition, context, placement));
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

export function isSiteNavLinkActive(link: SiteNavLink, pathname: string): boolean {
  if (link.kind !== "internal") {
    return false;
  }

  if (link.activeMatch === "none") {
    return false;
  }

  if (link.activeMatch === "exact") {
    return pathname === link.to;
  }

  return pathname === link.to || pathname.startsWith(`${link.to}/`);
}
