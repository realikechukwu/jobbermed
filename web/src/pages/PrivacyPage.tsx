import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function PrivacyPage() {
  return (
    <RouteShell title="Privacy Policy" subtitle="How JobberMed collects, uses, and protects your information.">
      <section className="shell-content" aria-label="Privacy policy">
        <CardPrimitive title="Privacy Policy">
          <div className="legal-content">
            <p>
              JobberMed values your privacy. This policy explains what information we collect, how we use it, and the
              choices you have.
            </p>

            <h3>Information we collect</h3>
            <p>
              When you subscribe to updates, we collect your email address. We may also collect limited analytics
              information to improve the website experience.
            </p>

            <h3>How we use information</h3>
            <p>
              We use your email address to send job updates and relevant announcements. We do not sell your data or
              share it with third parties for marketing.
            </p>

            <h3>Data storage</h3>
            <p>
              Newsletter subscriptions are managed through Brevo. Your data is stored under their platform and subject
              to their privacy and security practices.
            </p>

            <h3>Unsubscribe</h3>
            <p>
              You can unsubscribe at any time using the link included in each email. If you need help, contact us via
              JobberMed support channels.
            </p>

            <h3>Updates</h3>
            <p>We may update this policy from time to time. The latest version will always be posted on this page.</p>
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
