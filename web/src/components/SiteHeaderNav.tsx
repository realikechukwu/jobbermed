import { Link, useLocation } from "react-router-dom";
import { isSiteNavLinkActive, type SiteNavLink } from "../navigation/site-nav";

type SiteHeaderNavProps = {
  links: SiteNavLink[];
  email?: string;
  showSignOut: boolean;
  onSignOut: () => Promise<void> | void;
};

export function SiteHeaderNav({ links, email, showSignOut, onSignOut }: SiteHeaderNavProps) {
  const location = useLocation();

  return (
    <nav className="site-nav" aria-label="Primary">
      {links.map((link) => {
        const ctaClass = link.isCta ? " site-nav-cta" : "";

        if (link.kind === "external") {
          return (
            <a key={link.id} className={`site-nav-link${ctaClass}`} href={link.href}>
              {link.label}
            </a>
          );
        }

        const activeClass = isSiteNavLinkActive(link, location.pathname, location.search) ? " active" : "";

        return (
          <Link key={link.id} className={`site-nav-link${activeClass}${ctaClass}`} to={link.to}>
            {link.label}
          </Link>
        );
      })}

      {email ? <span className="site-nav-email">{email}</span> : null}

      {showSignOut ? (
        <button className="site-nav-button" type="button" onClick={() => void onSignOut()}>
          Sign Out
        </button>
      ) : null}
    </nav>
  );
}
