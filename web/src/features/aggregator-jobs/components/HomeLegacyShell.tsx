import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../auth/session-context";
import { getSupabaseClient } from "../../../lib/supabase-client";
import {
  getHomeMobilePrimaryLink,
  getHomeMobileSignUpLink,
  getSiteNavLinks,
  type SiteNavState,
} from "../../../navigation/site-nav";
import { SiteHeaderNav } from "../../../components/SiteHeaderNav";
import { SiteMobileDrawer } from "../../../components/SiteMobileDrawer";

type HomeLegacyShellProps = {
  children: ReactNode;
  heroSearch?: ReactNode;
};

export function HomeLegacyShell({ children, heroSearch }: HomeLegacyShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roles } = useSession();

  const navState = useMemo<SiteNavState>(
    () => ({
      isAuthenticated: Boolean(user),
      roles,
    }),
    [roles, user],
  );

  const headerLinks = useMemo(() => getSiteNavLinks("header", navState), [navState]);
  const mobileLinks = useMemo(() => getSiteNavLinks("mobile", navState), [navState]);
  const mobilePrimaryLink = useMemo(() => getHomeMobilePrimaryLink(navState), [navState]);
  const mobileSignUpLink = useMemo(() => getHomeMobileSignUpLink(navState), [navState]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <>
      <div className="top-strip" />

      <section className="hero-banner">
        <div className="hero-inner hero-inner-signin">
          <div className="hero-topbar">
            <SiteHeaderNav
              links={headerLinks}
              email={user?.email ?? ""}
              showSignOut={Boolean(user)}
              onSignOut={handleSignOut}
            />
          </div>

          <button
            className="mobile-menu-btn"
            type="button"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen ? "true" : "false"}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
            </svg>
            Menu
          </button>

          <Link className="brand-link" to="/" aria-label="Go to homepage">
            <img src="/images/logo.png" alt="JobberMed" className="brand-logo" />
          </Link>

          <h2 className="hero-title">Healthcare jobs across Nigeria and Africa.</h2>
          <h3 className="hero-subtitle">Delivered to your email every week.</h3>
          {heroSearch}
        </div>
      </section>

      <SiteMobileDrawer
        variant="home"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={location.pathname}
        search={location.search}
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
