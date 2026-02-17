import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSession } from "../features/auth/session-context";
import { getSupabaseClient } from "../lib/supabase-client";
import {
  getSiteNavLinks,
  type SiteNavState,
} from "../navigation/site-nav";
import { SiteMobileDrawer } from "./SiteMobileDrawer";

type HeroShellProps = {
  title: string;
  subtitle?: string;
};

export function HeroShell({ title, subtitle }: HeroShellProps) {
  const { user, roles } = useSession();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navState = useMemo<SiteNavState>(
    () => ({
      isAuthenticated: Boolean(user),
      roles,
    }),
    [roles, user],
  );

  const headerLinks = useMemo(() => getSiteNavLinks("app", "header", navState), [navState]);
  const mobileLinks = useMemo(() => getSiteNavLinks("app", "mobile", navState), [navState]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "site-nav-link active" : "site-nav-link";

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <section className="hero-banner">
      <div className="hero-inner">
        <div className="hero-top-row">
          <button
            className="site-mobile-menu-btn"
            type="button"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen ? "true" : "false"}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            Menu
          </button>

          <nav className="site-nav" aria-label="Primary">
            {headerLinks.map((link) => {
              if (link.kind === "external") {
                return (
                  <a key={link.id} className="site-nav-link" href={link.href}>
                    {link.label}
                  </a>
                );
              }

              return (
                <NavLink key={link.id} className={navClassName} to={link.to}>
                  {link.label}
                </NavLink>
              );
            })}

            {user ? (
              <button className="site-nav-button" type="button" onClick={() => void handleSignOut()}>
                Sign Out
              </button>
            ) : null}
          </nav>
        </div>

        <Link className="brand-link" to="/" aria-label="Go to homepage">
          <img className="brand-logo" src="/images/logo.png" alt="JobberMed" />
        </Link>

        <h1 className="hero-title">{title}</h1>
        {subtitle ? <p className="hero-subtitle">{subtitle}</p> : null}
      </div>

      <SiteMobileDrawer
        variant="app"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={location.pathname}
        email={user?.email ?? ""}
        links={mobileLinks}
        showSignOut={Boolean(user)}
        onSignOut={handleSignOut}
      />
    </section>
  );
}
