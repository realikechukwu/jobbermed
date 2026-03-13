import "../styles/landing.css";

const ROLES = ["Doctors", "Nurses", "Pharmacists", "Med Lab", "Radiographers", "Dentists", "Allied Health"];

export function LandingPage() {
  return (
    <div className="landing-page">
      <div className="top-strip" />

      <section className="hero-banner">
        <div className="hero-inner">
          <a className="brand-link" href="https://jobbermed.com/" aria-label="Go to homepage">
            <img src="/images/logo.png" alt="JobberMed" className="brand-logo" />
          </a>

          <h1 className="landing-headline">Find healthcare jobs faster</h1>

          <p className="landing-copy">
            Built for doctors, nurses, pharmacists, med lab professionals, radiographers, dentists,
            and allied health workers. Filter by specialty and location, and get tailored job alerts
            straight to your inbox.
          </p>
        </div>
      </section>

      <section className="landing-action">
        <div className="landing-action-inner">
          <div className="landing-ctas">
            <a className="landing-cta-primary" href="https://jobbermed.com/subscribe">
              Get weekly job alerts
            </a>
            <a className="landing-cta-secondary" href="https://jobbermed.com/">
              Browse jobs
            </a>
          </div>

          <div className="landing-roles" aria-label="Roles covered">
            <div className="landing-roles-track">
              {[...ROLES, ...ROLES].map((role, i) => (
                <span key={`${role}-${i}`} className="landing-role-chip">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <p className="landing-reassurance">
            New healthcare opportunities curated for professionals across Nigeria and Africa.
          </p>
        </div>
      </section>

      <footer className="footer-strip">
        <div className="landing-footer-inner">
          <div className="footer-inner">
            <a className="footer-link" href="https://jobbermed.com/">Home</a>
            <a className="footer-link" href="https://jobbermed.com/subscribe">Subscribe</a>
            <a className="footer-link" href="https://jobbermed.com/about">About</a>
          </div>
          <p className="landing-footer-copy">&copy; JobberMed 2026</p>
        </div>
      </footer>
    </div>
  );
}
