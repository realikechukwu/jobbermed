import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scroll to the top when a link takes the user to a new page.
 * Only PUSH navigations: REPLACE is used for in-page filter/URL syncing and
 * POP (back/forward) should keep the browser's position.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType !== "PUSH" || hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
}
