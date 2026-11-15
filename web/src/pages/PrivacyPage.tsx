import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED,
} from "../features/aggregator-jobs/privacy";
import { RouteShell } from "../layouts/RouteShell";

export function PrivacyPage() {
  return (
    <RouteShell title="Privacy Policy" subtitle="How JobberMed collects, uses, and protects your information.">
      <section className="shell-content" aria-label="Privacy policy">
        <CardPrimitive title="How we handle your data" meta={PRIVACY_UPDATED}>
          <div className="legal-content">
            <p>{PRIVACY_INTRO}</p>

            {PRIVACY_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.text}</p>
              </div>
            ))}

            <h3>Contact us and updates</h3>
            <p>
              To request access to, correction of, or deletion of your account and personal data, email{" "}
              <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a> or manage your email alerts in{" "}
              <Link to="/account/personalization">email settings</Link>. We may update this policy as we add
              new features, and the latest version will always be published on this page.
            </p>
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
