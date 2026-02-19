import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function AboutPage() {
  return (
    <RouteShell title="About JobberMed" subtitle="Who we are and how the platform helps healthcare professionals.">
      <section className="shell-content" aria-label="About JobberMed">
        <CardPrimitive title="About Us">
          <div className="legal-content">
            <p>
              JobberMed is a medical job aggregator focused on making healthcare opportunities easier to find and
              compare.
            </p>
            <p>
              We pull listings from multiple trusted sources and present them in one place so clinicians,
              administrators, and allied health professionals can discover roles faster.
            </p>
            <p>
              We are not an employer or recruiter. Each listing links back to the original source for full details
              and application instructions.
            </p>
            <p>
              Our mission is to help healthcare professionals across Nigeria and Africa access opportunities with less
              friction and more transparency.
            </p>
          </div>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
