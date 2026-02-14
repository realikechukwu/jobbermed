import { NavLink, Link } from "react-router-dom";

type HeroShellProps = {
  title: string;
  subtitle?: string;
};

export function HeroShell({ title, subtitle }: HeroShellProps) {
  const navClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "site-nav-link active" : "site-nav-link";

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
            <NavLink className={navClassName} to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className={navClassName} to="/signin">
              Sign In
            </NavLink>
            <NavLink className={navClassName} to="/signup">
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
