import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../../auth/session-context";
import { getSupabaseClient } from "../../../lib/supabase-client";
import {
  getHomeMobilePrimaryLink,
  getHomeMobileSignUpLink,
  getSiteNavLinks,
  type SiteNavState,
} from "../../../navigation/site-nav";
import { SiteMobileDrawer } from "../../../components/SiteMobileDrawer";

type HomeLegacyShellProps = {
  children: ReactNode;
};

export function HomeLegacyShell({ children }: HomeLegacyShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, roles } = useSession();

  const navState = useMemo<SiteNavState>(
    () => ({
      isAuthenticated: Boolean(user),
      roles,
    }),
    [roles, user],
  );

  const headerLinks = useMemo(() => getSiteNavLinks("home", "header", navState), [navState]);
  const mobileLinks = useMemo(() => getSiteNavLinks("home", "mobile", navState), [navState]);
  const mobilePrimaryLink = useMemo(() => getHomeMobilePrimaryLink(navState), [navState]);
  const mobileSignUpLink = useMemo(() => getHomeMobileSignUpLink(navState), [navState]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <>
      <div className="top-strip" />

      <section className="hero-banner">
        <div className="hero-inner hero-inner-signin">
          <div className="hero-topbar">
            <nav className="hero-nav" aria-label="Primary">
              {headerLinks.map((link) => {
                if (link.kind === "external") {
                  return (
                    <a key={link.id} className="hero-nav-link" href={link.href}>
                      {link.label}
                    </a>
                  );
                }

                return (
                  <Link key={link.id} className="hero-nav-link" to={link.to}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hero-auth">
              {user ? <span className="hero-user-email">{user.email}</span> : null}
              {!user ? (
                <Link className="hero-auth-link" to="/signin">
                  Sign In
                </Link>
              ) : (
                <button className="hero-auth-link hero-signout" type="button" onClick={() => void handleSignOut()}>
                  Sign Out
                </button>
              )}
            </div>
          </div>

          <button
            className="mobile-menu-btn"
            type="button"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen ? "true" : "false"}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            Menu
          </button>

          <Link className="brand-link" to="/" aria-label="Go to homepage">
            <img src="/images/logo.png" alt="JobberMed" className="brand-logo" />
          </Link>

          <h2 className="hero-title">Healthcare jobs across Nigeria and Africa.</h2>
          <h3 className="hero-subtitle">Delivered to your email every week.</h3>
        </div>
      </section>

      <SiteMobileDrawer
        variant="home"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={location.pathname}
        email={user?.email ?? ""}
        primaryLink={mobilePrimaryLink}
        links={mobileLinks}
        supplementalLink={mobileSignUpLink}
        showSignOut={Boolean(user)}
        onSignOut={handleSignOut}
      />

      <div className="page">{children}</div>
    </>
  );
}
