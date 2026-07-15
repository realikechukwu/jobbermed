import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../features/auth/session-context";
import { getSupabaseClient } from "../lib/supabase-client";
import { getSiteNavLinks, type SiteNavState } from "../navigation/site-nav";
import { SiteHeaderNav } from "./SiteHeaderNav";
import { SiteMobileDrawer } from "./SiteMobileDrawer";

type HeroShellProps = {
  title: string;
  subtitle?: string;
  variant?: "hero" | "compact";
};

export function HeroShell({ title, subtitle, variant = "hero" }: HeroShellProps) {
  const { user, roles } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navState = useMemo<SiteNavState>(
    () => ({
      isAuthenticated: Boolean(user),
      roles,
    }),
    [roles, user],
  );

  const headerLinks = useMemo(() => getSiteNavLinks("header", navState), [navState]);
  const mobileLinks = useMemo(() => getSiteNavLinks("mobile", navState), [navState]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <section className={`hero-banner${variant === "compact" ? " hero-banner--compact" : ""}`}>
      <div className="hero-inner">
        <div className="hero-top-row">
          <button
            className="site-mobile-menu-btn"
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

          <SiteHeaderNav links={headerLinks} showSignOut={Boolean(user)} onSignOut={handleSignOut} />
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
        search={location.search}
        email={user?.email ?? ""}
        links={mobileLinks}
        showSignOut={Boolean(user)}
        onSignOut={handleSignOut}
      />
    </section>
  );
}
