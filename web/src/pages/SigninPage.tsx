import { type FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { useSession } from "../features/auth/session-context";
import { RouteShell } from "../layouts/RouteShell";
import { getSupabaseClient } from "../lib/supabase-client";

function resolveNextPath(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export function SigninPage() {
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = useMemo(() => resolveNextPath(searchParams.get("next")), [searchParams]);

  if (!isLoading && user) {
    return <Navigate to={nextPath} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error: signinError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signinError) {
        throw signinError;
      }

      window.location.assign(nextPath);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to sign in.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RouteShell title="Sign in" subtitle="Access recruiter, MDCN, and admin dashboards.">
      <section className="shell-content" aria-label="Sign in">
        <CardPrimitive title="Sign in to JobberMed">
          <form className="shell-form" onSubmit={handleSubmit}>
            <label className="shell-label" htmlFor="signin-email">
              Email
            </label>
            <input
              className="shell-input"
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label className="shell-label" htmlFor="signin-password">
              Password
            </label>
            <input
              className="shell-input"
              id="signin-password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="native-form-message native-form-error">{error}</p> : null}

            <button className="shell-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Continue"}
            </button>
          </form>

          <p className="meta auth-aux-link">
            Need an account? <Link to="/signup">Create one</Link>
          </p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
