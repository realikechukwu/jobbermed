import { NavLink, Link } from "react-router-dom";

type HeroShellProps = {
  title: string;
  subtitle?: string;
};

export function HeroShell({ title, subtitle }: HeroShellProps) {
  return (
    <section className="hero-banner">
      <div className="hero-inner">
        <div className="hero-top-row">
          <nav className="site-nav" aria-label="Primary">
            <NavLink className="site-nav-link" to="/">
              Home
            </NavLink>
            <NavLink className="site-nav-link" to="/native-jobs">
              Native Jobs
            </NavLink>
            <NavLink className="site-nav-link" to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className="site-nav-link" to="/signin">
              Sign In
            </NavLink>
            <NavLink className="site-nav-link" to="/signup">
              Sign Up
            </NavLink>
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
