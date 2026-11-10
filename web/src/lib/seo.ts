import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const SITE_URL = "https://jobbermed.com";
export const SITE_NAME = "JobberMed";
export const DEFAULT_TITLE = "Healthcare Jobs in Nigeria & Africa | JobberMed";
export const DEFAULT_DESCRIPTION =
  "Browse live healthcare jobs in Nigeria and across Africa for doctors, nurses, pharmacists, lab scientists and allied health professionals. Updated daily from five job boards.";

export type PageMeta = {
  title?: string;
  description?: string;
  /** Canonical path, e.g. "/about". */
  path?: string;
  noindex?: boolean;
};

// Keep in sync with PUBLIC_PAGES in scripts/prerender-seo.mjs.
const ROUTE_META: Record<string, PageMeta> = {
  "/": {},
  "/about": {
    title: "About JobberMed | Healthcare Job Board for Nigeria & Africa",
    description:
      "JobberMed gathers healthcare vacancies from trusted job boards so clinicians and allied health professionals across Nigeria and Africa can find roles faster.",
  },
  "/privacy": {
    title: "Privacy Policy | JobberMed",
    description: "How JobberMed collects, uses and protects your personal information.",
  },
  "/subscribe": {
    title: "Healthcare Job Alerts by Email | JobberMed",
    description: "Subscribe to JobberMed and get new healthcare jobs in Nigeria and Africa sent to your inbox.",
  },
  "/landing": {
    title: "Find Healthcare Jobs Faster | JobberMed",
    description:
      "One place to find jobs for doctors, nurses, pharmacists and allied health professionals. Filter by specialty and location.",
  },
  "/signup": {
    title: "Create Your Free Account | JobberMed",
    description: "Sign up to save healthcare jobs, set preferences and apply directly on JobberMed.",
  },
  "/signin": {
    title: "Sign In | JobberMed",
    description: "Sign in to your JobberMed account to manage saved jobs and applications.",
  },
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function applyPageMeta(meta: PageMeta) {
  const title = meta.title ?? DEFAULT_TITLE;
  const description = meta.description ?? DEFAULT_DESCRIPTION;
  const canonical = `${SITE_URL}${meta.path ?? "/"}`;

  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonical;
}

export function getRouteMeta(pathname: string): PageMeta {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const known = ROUTE_META[normalized];
  if (known) {
    return { ...known, path: normalized };
  }

  if (normalized.startsWith("/jobs/")) {
    return { path: normalized };
  }

  // Account, dashboard and other app-only screens stay out of search results.
  return { title: `${SITE_NAME}`, path: normalized, noindex: true };
}

/** Sets title, description, canonical and robots for the current route. */
export function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    applyPageMeta(getRouteMeta(pathname));
  }, [pathname]);

  return null;
}
