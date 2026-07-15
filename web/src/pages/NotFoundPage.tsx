import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function NotFoundPage() {
  return (
    <RouteShell title="Page not found" subtitle="The page you are looking for does not exist or has moved.">
      <section className="shell-content" aria-label="Page not found">
        <CardPrimitive title="Let's get you back on track">
          <p className="meta">Here are a few places to continue:</p>
          <div className="dashboard-links">
            <Link className="shell-button dashboard-link" to="/">
              Browse all jobs
            </Link>
            <Link className="shell-button dashboard-link" to="/?source=direct">
              Direct Apply jobs
            </Link>
            <Link className="shell-button dashboard-link" to="/subscribe">
              Subscribe to the newsletter
            </Link>
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
