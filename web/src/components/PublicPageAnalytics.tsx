import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { parseLandingPath } from "../features/aggregator-jobs/landing";
import { getArticle } from "../features/blog/articles";
import { captureEvent } from "../lib/analytics";

const publicPages = new Set(["/", "/about", "/blog", "/landing", "/privacy", "/subscribe", "/subscribe/confirmed"]);

function publicPagePath(pathname: string): string | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (publicPages.has(path) || parseLandingPath(path)) return path;
  if (/^\/jobs\/direct\/[^/]+$/.test(path)) return "/jobs/direct/:jobId";
  if (/^\/jobs\/[^/]+$/.test(path) && path !== "/jobs/direct") return "/jobs/:jobSlug";
  if (path.startsWith("/blog/") && getArticle(path.slice("/blog/".length))) return path;
  return undefined;
}

export function PublicPageAnalytics() {
  const { pathname } = useLocation();
  const previousPath = useRef<string>();

  useEffect(() => {
    if (pathname === previousPath.current) return;
    previousPath.current = pathname;
    const path = publicPagePath(pathname);
    if (path) {
      captureEvent("$pageview", { $pathname: path, $current_url: `${window.location.origin}${path}` });
    }
  }, [pathname]);

  return null;
}
