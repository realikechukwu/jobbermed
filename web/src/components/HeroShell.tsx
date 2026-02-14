import { Link, NavLink } from "react-router-dom";
import { useSession } from "../features/auth/session-context";
import { getSupabaseClient } from "../lib/supabase-client";

type HeroShellProps = {
  title: string;
  subtitle?: string;
};

export function HeroShell({ title, subtitle }: HeroShellProps) {
  const { user, hasRole, isLoading } = useSession();

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "site-nav-link active" : "site-nav-link";

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  const showRecruiterLink = !isLoading && user && (hasRole("recruiter") || hasRole("admin"));
  const showMdcnLink = !isLoading && user && (hasRole("mdcn_official") || hasRole("admin"));
  const showAdminLink = !isLoading && user && hasRole("admin");

  return (
    <section className="hero-banner">
      <div className="hero-inner">
        <div className="hero-top-row">
          <nav className="site-nav" aria-label="Primary">
            <NavLink className={navClassName} to="/">
              Home
            </NavLink>
            <NavLink className={navClassName} to="/native-jobs">
              Native Jobs
            </NavLink>

            {user ? (
              <NavLink className={navClassName} to="/dashboard">
                Dashboard
              </NavLink>
            ) : null}

            {showRecruiterLink ? (
              <NavLink className={navClassName} to="/recruiter">
                Recruiter
              </NavLink>
            ) : null}

            {showMdcnLink ? (
              <NavLink className={navClassName} to="/mdcn">
                MDCN
              </NavLink>
            ) : null}

            {showAdminLink ? (
              <NavLink className={navClassName} to="/admin">
                Admin
              </NavLink>
            ) : null}

            {!user ? (
              <>
                <NavLink className={navClassName} to="/signin">
                  Sign In
                </NavLink>
                <NavLink className={navClassName} to="/signup">
                  Sign Up
                </NavLink>
              </>
            ) : (
              <button className="site-nav-button" type="button" onClick={() => void handleSignOut()}>
                Sign Out
              </button>
            )}
          </nav>
        </div>

        <Link className="brand-link" to="/" aria-label="Go to homepage">
          <img className="brand-logo" src="/images/logo.png" alt="JobberMed" />
        </Link>

        <h1 className="hero-title">{title}</h1>
        {subtitle ? <p className="hero-subtitle">{subtitle}</p> : null}
      </div>
    </section>
  );
}
