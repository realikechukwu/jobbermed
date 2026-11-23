import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { captureEvent } from "../lib/analytics";
import { publicPagePath } from "../lib/public-pages";

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
