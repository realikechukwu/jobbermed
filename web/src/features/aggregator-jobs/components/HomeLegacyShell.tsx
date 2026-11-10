import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../auth/session-context";
import { getSupabaseClient } from "../../../lib/supabase-client";
import { getSiteNavLinks, type SiteNavState } from "../../../navigation/site-nav";
import { SiteHeaderNav } from "../../../components/SiteHeaderNav";
import { SiteMobileDrawer } from "../../../components/SiteMobileDrawer";

type HomeLegacyShellProps = {
  children: ReactNode;
  heroSearch?: ReactNode;
  heroEyebrow?: ReactNode;
  heroStats?: ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
};

const DEFAULT_HERO_TITLE = "Healthcare jobs across Nigeria and Africa.";
const DEFAULT_HERO_SUBTITLE =
  "Roles for doctors, nurses, pharmacists and allied health professionals, gathered from trusted job boards into one feed.";

export function HomeLegacyShell({
  children,
  heroSearch,
  heroEyebrow,
  heroStats,
  heroTitle,
  heroSubtitle,
}: HomeLegacyShellProps) {
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
      <header className="hero-card">
        <div className="glass-nav">
          <Link className="brand-wordmark" to="/" aria-label="JobberMed home">
            Jobber<span>Med</span>
          </Link>

          <SiteHeaderNav
            links={headerLinks}
            email={user?.email ?? ""}
            showSignOut={Boolean(user)}
            onSignOut={handleSignOut}
          />

          <button
            className="mobile-menu-btn"
            type="button"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen ? "true" : "false"}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>

        <div className="hero-copy">
          {heroEyebrow}
          <h1 className="hero-title">{heroTitle ?? DEFAULT_HERO_TITLE}</h1>
          <p className="hero-subtitle">{heroSubtitle ?? DEFAULT_HERO_SUBTITLE}</p>
          {heroSearch}
          {heroStats}
        </div>
      </header>

      <SiteMobileDrawer
        variant="home"
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={location.pathname}
        search={location.search}
        email={user?.email ?? ""}
        links={mobileLinks}
        showSignOut={Boolean(user)}
        onSignOut={handleSignOut}
      />

      <div className="page">{children}</div>
    </>
  );
}
