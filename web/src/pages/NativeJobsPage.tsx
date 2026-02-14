import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function NativeJobsPage() {
  return (
    <RouteShell
      title="Native healthcare jobs"
      subtitle="Direct-employer experiences will be implemented next."
    >
      <section className="shell-content" aria-label="Native jobs shell">
        <CardPrimitive title="Native jobs route" meta="No application logic yet">
          <p className="meta">This page is scaffolded only. Search/filter/apply behavior is intentionally not implemented.</p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
