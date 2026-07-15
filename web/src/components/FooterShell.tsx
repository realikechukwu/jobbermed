import { Link, useLocation } from "react-router-dom";
import { useSession } from "../features/auth/session-context";
import { getSiteNavLinks, isSiteNavLinkActive, type SiteNavState } from "../navigation/site-nav";

export function FooterShell() {
  const { user, roles } = useSession();
  const location = useLocation();

  const navState: SiteNavState = {
    isAuthenticated: Boolean(user),
    roles,
  };

  const footerLinks = getSiteNavLinks("footer", navState);

  return (
    <footer className="footer-strip" aria-label="Footer">
      <div className="footer-inner">
        {footerLinks.map((link) => {
          if (link.kind === "external") {
            return (
              <a key={link.id} className="footer-link" href={link.href}>
                {link.label}
              </a>
            );
          }

          const activeClass = isSiteNavLinkActive(link, location.pathname, location.search) ? " active" : "";

          return (
            <Link key={link.id} className={`footer-link${activeClass}`} to={link.to}>
              {link.label}
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
