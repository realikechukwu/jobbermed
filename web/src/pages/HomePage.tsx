import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function HomePage() {
  return (
    <RouteShell
      title="Healthcare jobs across Nigeria and Africa."
      subtitle="Delivered to your email every week."
    >
      <section className="shell-grid" aria-label="Home overview cards">
        <CardPrimitive title="Live jobs" meta="Route shell only">
          <p className="meta">Job listing aggregation logic will be added in a follow-up task.</p>
        </CardPrimitive>
        <CardPrimitive title="Weekly updates" meta="Route shell only">
          <p className="meta">Personalized delivery settings are available in Dashboard preferences.</p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
