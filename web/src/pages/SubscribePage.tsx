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

          <div className="subscribe-embed">
            <iframe
              src="https://58681e2d.sibforms.com/serve/MUIFAHXVR5tRFBDTcOiuh20_p5-O29yy8k6p5GA7_6vI8Mb29oJKSmjzFdFS_42mJMKpX3gRAnzPHIXoo3rmGHyDPdPUTmBgyYut9bQsy96jN4w0GOoddcGrWFGZYkT0ZFaCl4M5fCzyZig_rPFG-yB2pE-Lqro3GCHZ9det5WfikZkmJgdeG6iMIEktzRDAxSIwlId0D8akd_v1Cw=="
              title="Newsletter signup form"
              loading="lazy"
            />
          </div>

          <p className="preference-meta">
            If the form does not load, refresh the page or try again with network protections disabled.
          </p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
