import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function DashboardPage() {
  return (
    <RouteShell title="Dashboard" subtitle="Profile and saved jobs shell.">
      <section className="shell-grid" aria-label="Dashboard shell cards">
        <CardPrimitive title="Profile" meta="Route shell only">
          <p className="meta">User profile editing integration is deferred.</p>
        </CardPrimitive>
        <CardPrimitive title="Saved jobs" meta="Route shell only">
          <p className="meta">Saved jobs retrieval and actions are deferred.</p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
