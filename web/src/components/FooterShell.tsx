import { NavLink } from "react-router-dom";
import { useSession } from "../features/auth/session-context";
import { getSiteNavLinks, type SiteNavState } from "../navigation/site-nav";

export function FooterShell() {
  const { user, roles } = useSession();

  const navState: SiteNavState = {
    isAuthenticated: Boolean(user),
    roles,
  };

  const footerLinks = getSiteNavLinks("app", "footer", navState);

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

          return (
            <NavLink key={link.id} className="footer-link" to={link.to}>
              {link.label}
            </NavLink>
          );
        })}
      </div>
    </footer>
  );
}
