import { type FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { RouteShell } from "../layouts/RouteShell";
import { getSupabaseClient } from "../lib/supabase-client";

function resolveResetRedirectTo(): string {
  if (typeof window === "undefined" || !window.location?.origin) {
    return "/reset-password";
  }
  return `${window.location.origin}/reset-password`;
}

function isRedirectConfigError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("redirect") || normalized.includes("allowlist");
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(() => resolveResetRedirectTo(), []);
  const showRedirectHint = Boolean(error && isRedirectConfigError(error));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const normalizedEmail = email.trim().toLowerCase();
    const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!normalizedEmail || !isEmailFormatValid) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo,
      });

      if (resetError) {
        throw resetError;
      }

      setNotice("If an account exists for that email, we've sent a reset link.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to send reset email.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RouteShell title="Forgot password" subtitle="Request a password reset email to regain access to your account.">
      <section className="shell-content" aria-label="Forgot password">
        <CardPrimitive title="Reset your password">
          <form className="shell-form" onSubmit={handleSubmit}>
            <label className="shell-label" htmlFor="forgot-password-email">
              Email
            </label>
            <input
              className="shell-input"
              id="forgot-password-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            {error ? <p className="native-form-message native-form-error">{error}</p> : null}
            {showRedirectHint ? (
              <p className="meta">Check Supabase Auth redirect URL allowlist for: {redirectTo}</p>
            ) : null}
            {notice ? <p className="native-form-message native-form-success">{notice}</p> : null}

            <button className="shell-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          <p className="meta auth-aux-link">
            Remembered your password? <Link to="/signin">Sign in</Link>
          </p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
