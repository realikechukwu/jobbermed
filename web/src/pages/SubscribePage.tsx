import { BrevoSubscribeForm } from "../components/BrevoSubscribeForm";
import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function SubscribePage() {
  return (
    <RouteShell title="Subscribe to the newsletter" subtitle="Receive weekly healthcare job alerts in your inbox.">
      <section className="shell-content" aria-label="Newsletter subscription">
        <CardPrimitive title="Get Weekly Job Alerts" meta="Free updates. No spam.">
          <div className="legal-content">
            <p>
              Receive the latest medical and healthcare jobs delivered weekly. You can also manage delivery settings
              from your dashboard after signing in.
            </p>
          </div>

          <div className="subscribe-native">
            <BrevoSubscribeForm />
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
