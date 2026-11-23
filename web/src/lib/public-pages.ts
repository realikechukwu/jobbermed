import { parseLandingPath } from "../features/aggregator-jobs/landing";
import { getArticle } from "../features/blog/articles";

const publicPages = new Set(["/", "/about", "/blog", "/landing", "/privacy", "/subscribe", "/subscribe/confirmed"]);

/** The route pattern for a public page, or undefined for private and unknown routes. */
export function publicPagePath(pathname: string): string | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (publicPages.has(path) || parseLandingPath(path)) return path;
  if (/^\/jobs\/direct\/[^/]+$/.test(path)) return "/jobs/direct/:jobId";
  if (/^\/jobs\/[^/]+$/.test(path) && path !== "/jobs/direct") return "/jobs/:jobSlug";
  if (path.startsWith("/blog/") && getArticle(path.slice("/blog/".length))) return path;
  return undefined;
}
