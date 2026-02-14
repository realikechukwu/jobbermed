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

export function SignupPage() {
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = useMemo(() => resolveNextPath(searchParams.get("next")), [searchParams]);

  if (!isLoading && user) {
    return <Navigate to={nextPath} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || null,
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (data.session) {
        window.location.assign(nextPath);
        return;
      }

      setNotice("Account created. Check your email to confirm and then sign in.");
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to create account.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RouteShell title="Create account" subtitle="Start as a candidate and request additional platform roles.">
      <section className="shell-content" aria-label="Sign up">
        <CardPrimitive title="Create your JobberMed account">
          <form className="shell-form" onSubmit={handleSubmit}>
            <label className="shell-label" htmlFor="signup-name">
              Full name
            </label>
            <input
              className="shell-input"
              id="signup-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />

            <label className="shell-label" htmlFor="signup-email">
              Email
            </label>
            <input
              className="shell-input"
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <label className="shell-label" htmlFor="signup-password">
              Password
            </label>
            <input
              className="shell-input"
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create password"
              autoComplete="new-password"
              required
            />

            <label className="shell-label" htmlFor="signup-confirm-password">
              Confirm password
            </label>
            <input
              className="shell-input"
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              required
            />

            {error ? <p className="native-form-message native-form-error">{error}</p> : null}
            {notice ? <p className="native-form-message native-form-success">{notice}</p> : null}

            <button className="shell-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="meta auth-aux-link">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
