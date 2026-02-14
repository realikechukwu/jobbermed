import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function SigninPage() {
  return (
    <RouteShell title="Sign in" subtitle="Access saved jobs and your dashboard.">
      <section className="shell-content" aria-label="Sign in shell">
        <CardPrimitive title="Sign in" meta="Route shell only">
          <form className="shell-form" onSubmit={(e) => e.preventDefault()}>
            <label className="shell-label" htmlFor="signin-email">Email</label>
            <input className="shell-input" id="signin-email" type="email" placeholder="you@example.com" />
            <label className="shell-label" htmlFor="signin-password">Password</label>
            <input className="shell-input" id="signin-password" type="password" placeholder="Password" />
            <button className="shell-button" type="submit">Continue</button>
          </form>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
