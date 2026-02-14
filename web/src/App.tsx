import { CardPrimitive } from "./components/CardPrimitive";
import { RouteShell } from "./layouts/RouteShell";

export function App() {
  return (
    <RouteShell
      title="Healthcare jobs across Nigeria and Africa."
      subtitle="Delivered to your email every week."
    >
      <section className="shell-grid" aria-label="Foundation cards">
        <CardPrimitive
          title="Style parity foundation"
          meta="Top strip, hero shell, footer shell, and card primitives are active."
        >
          <p className="meta">Routing shells and page-specific logic land in the next commit.</p>
        </CardPrimitive>
      </section>
      <section className="shell-content" aria-label="Build status">
        <CardPrimitive title="Web workspace" meta="Scaffolded with TypeScript and Vite">
          <p className="meta">Supabase client wrapper reads only from Vite env variables.</p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
