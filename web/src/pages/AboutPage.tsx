import { CardPrimitive } from "../components/CardPrimitive";
import { ABOUT_PARAGRAPHS } from "../features/aggregator-jobs/about";
import { RouteShell } from "../layouts/RouteShell";

export function AboutPage() {
  return (
    <RouteShell title="About JobberMed" subtitle="Who we are and how the platform helps healthcare professionals.">
      <section className="shell-content" aria-label="About JobberMed">
        <CardPrimitive title="About Us">
          <div className="legal-content">
            {ABOUT_PARAGRAPHS.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p>To report an issue with a listing, email <a href="mailto:hello@jobbermed.com">hello@jobbermed.com</a>.</p>
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
