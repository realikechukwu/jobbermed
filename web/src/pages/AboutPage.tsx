import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import {
  ABOUT_EMPLOYER_PARAGRAPHS,
  ABOUT_FEATURES,
  ABOUT_GUIDE_PATH,
  ABOUT_GUIDE_TITLE,
  ABOUT_PARAGRAPHS,
} from "../features/aggregator-jobs/about";
import { CV_MATCH_URL } from "../features/blog/articles";
import { RouteShell } from "../layouts/RouteShell";

export function AboutPage() {
  return (
    <RouteShell title="About JobberMed" subtitle="Who we are and how the platform helps healthcare professionals across Nigeria and Africa.">
      <section className="shell-content" aria-label="About JobberMed">
        <CardPrimitive title="Why JobberMed exists" meta="Built for clinicians and allied health professionals in Nigeria and across Africa.">
          <div className="legal-content">
            {ABOUT_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p className="preference-note">
              <strong>New to JobberMed?</strong> Read our visual walkthrough with live screenshots:{" "}
              <Link to={ABOUT_GUIDE_PATH}>{ABOUT_GUIDE_TITLE}</Link>. You can also explore findings from our{" "}
              <Link to="/landing">survey of 294 Nigerian healthcare professionals</Link>.
            </p>
          </div>
          <div className="dashboard-links">
            <Link className="shell-button dashboard-link dashboard-link-primary" to={ABOUT_GUIDE_PATH}>
              Read: How to Use JobberMed (with screenshots)
            </Link>
            <Link className="shell-button dashboard-link" to="/">
              Browse live healthcare jobs
            </Link>
          </div>
        </CardPrimitive>
      </section>

      <section className="shell-content" aria-label="What you can do on JobberMed">
        <CardPrimitive title="How JobberMed helps your job search" meta="Free tools to find, evaluate and apply for healthcare roles faster.">
          <div className="legal-content">
            {ABOUT_FEATURES.map((feature) => (
              <div key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
          <div className="dashboard-links">
            <a className="shell-button dashboard-link" href={CV_MATCH_URL}>
              Open CV Match (free, no account needed)
            </a>
            <Link className="shell-button dashboard-link" to="/account/personalization">
              Customise job alert emails
            </Link>
            <Link className="shell-button dashboard-link" to="/blog">
              Read all career guides
            </Link>
          </div>
        </CardPrimitive>
      </section>

      <section className="shell-content" aria-label="Employers and listing sources">
        <CardPrimitive title="How listings work & hiring on JobberMed" meta="External job boards and Direct Apply employer postings.">
          <div className="legal-content">
            {ABOUT_EMPLOYER_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p>
              To report an issue with a listing or ask about posting roles, email{" "}
              <a href="mailto:hello@jobbermed.com">hello@jobbermed.com</a> or{" "}
              <Link to="/request-access/recruiter">request recruiter access</Link>.
            </p>
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
