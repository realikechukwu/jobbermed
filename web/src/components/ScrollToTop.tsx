import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scroll to the top when a link takes the user to a new page.
 * Only PUSH navigations: REPLACE is used for in-page filter/URL syncing and
 * POP (back/forward) should keep the browser's position.
 * A PUSH that keeps the same pathname (e.g. ?job= opening the detail panel)
 * is not a new page, so the position is kept.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const previousPathnameRef = useRef(pathname);

  useLayoutEffect(() => {
    const pathnameChanged = previousPathnameRef.current !== pathname;
    previousPathnameRef.current = pathname;

    if (!pathnameChanged || navigationType !== "PUSH" || hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
}
