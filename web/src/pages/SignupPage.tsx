import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";

export function SignupPage() {
  return (
    <RouteShell title="Create account" subtitle="Set up your profile to personalize jobs.">
      <section className="shell-content" aria-label="Sign up shell">
        <CardPrimitive title="Sign up" meta="Route shell only">
          <form className="shell-form" onSubmit={(e) => e.preventDefault()}>
            <label className="shell-label" htmlFor="signup-name">Full name</label>
            <input className="shell-input" id="signup-name" type="text" placeholder="Your name" />
            <label className="shell-label" htmlFor="signup-email">Email</label>
            <input className="shell-input" id="signup-email" type="email" placeholder="you@example.com" />
            <label className="shell-label" htmlFor="signup-password">Password</label>
            <input className="shell-input" id="signup-password" type="password" placeholder="Create password" />
            <button className="shell-button" type="submit">Create account</button>
          </form>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
