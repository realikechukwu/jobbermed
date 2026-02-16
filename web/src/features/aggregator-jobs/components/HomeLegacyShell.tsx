import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../../auth/session-context";
import { getSupabaseClient } from "../../../lib/supabase-client";

type HomeLegacyShellProps = {
  children: ReactNode;
};

export function HomeLegacyShell({ children }: HomeLegacyShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useSession();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

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
              <Link className="hero-nav-link" to="/">
                Home
              </Link>
              {user ? (
                <Link className="hero-nav-link" to="/dashboard">
                  Dashboard
                </Link>
              ) : null}
              <Link className="hero-nav-link" to="/native-jobs">
                Subscribe
              </Link>
              <a className="hero-nav-link" href="https://jobbermed.com/about.html">
                About Us
              </a>
              <a className="hero-nav-link" href="https://jobbermed.com/privacy.html">
                Privacy Policy
              </a>
            </nav>

            <div className="hero-auth">
              <span className="hero-user-email">{user?.email ?? ""}</span>
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

      <div
        className={`mobile-menu-overlay${isMobileMenuOpen ? " show" : ""}`}
        role="presentation"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`mobile-menu${isMobileMenuOpen ? " open" : ""}`} aria-hidden={isMobileMenuOpen ? "false" : "true"}>
        <button className="mobile-menu-close" type="button" aria-label="Close menu" onClick={() => setIsMobileMenuOpen(false)}>
          X
        </button>

        <div className="mobile-menu-email">{user?.email ?? ""}</div>

        <Link className="mobile-menu-link" to={user ? "/dashboard" : "/signin"}>
          {user ? "Dashboard" : "Sign In"}
        </Link>

        <nav className="mobile-menu-links">
          <Link className={`mobile-menu-link${location.pathname === "/" ? " active" : ""}`} to="/">
            Home
          </Link>
          {user ? (
            <Link className={`mobile-menu-link${location.pathname.startsWith("/dashboard") ? " active" : ""}`} to="/dashboard">
              Dashboard
            </Link>
          ) : null}
          <Link className={`mobile-menu-link${location.pathname.startsWith("/native-jobs") ? " active" : ""}`} to="/native-jobs">
            Subscribe
          </Link>
          <a className="mobile-menu-link" href="https://jobbermed.com/about.html">
            About Us
          </a>
          <a className="mobile-menu-link" href="https://jobbermed.com/privacy.html">
            Privacy Policy
          </a>
        </nav>

        {!user ? (
          <Link className="mobile-menu-link" to="/signup">
            Sign Up
          </Link>
        ) : null}

        {user ? (
          <button className="mobile-menu-signout" type="button" onClick={() => void handleSignOut()}>
            Sign Out
          </button>
        ) : null}
      </aside>

      <div className="page">{children}</div>
    </>
  );
}
