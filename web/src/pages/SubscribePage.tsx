import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { NewsletterForm } from "../features/newsletter/NewsletterForm";
import { captureNewsletterConfirmation, subscribeEntryPoint } from "../features/newsletter/analytics";
import { RouteShell } from "../layouts/RouteShell";

export function SubscribePage() {
  const [params] = useSearchParams();
  return (
    <RouteShell title="Subscribe to JobberMed" subtitle="Get healthcare vacancies in your inbox each week.">
      <main>
        <NewsletterForm placement="subscribe" entryPoint={subscribeEntryPoint(params.get("from"))} />
      </main>
    </RouteShell>
  );
}

export function NewsletterConfirmedPage() {
  useEffect(() => captureNewsletterConfirmation(), []);

  return (
    <RouteShell title="Subscription confirmed" subtitle="You’re signed up for JobberMed’s weekly job alerts.">
      <main className="shell-content">
        <Link to="/">Browse healthcare jobs</Link>
      </main>
    </RouteShell>
  );
}
