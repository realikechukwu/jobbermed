import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { useSession } from "../features/auth/session-context";
import { RouteShell } from "../layouts/RouteShell";
import { getSupabaseClient } from "../lib/supabase-client";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasRecoverySession = Boolean(user);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        throw updateError;
      }

      setNotice("Password updated. Redirecting to dashboard...");
      window.setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 700);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to update password.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RouteShell title="Reset password" subtitle="Set a new password for your account.">
      <section className="shell-content" aria-label="Reset password">
        <CardPrimitive title="Set a new password">
          <p className="meta">
            You're here from a reset email link. Enter a new password to finish restoring account access.
          </p>

          {isLoading ? <p className="meta">Checking reset link...</p> : null}

          {!isLoading && !hasRecoverySession ? (
            <div className="preference-state">
              <p className="native-form-message native-form-error">Invalid or expired link.</p>
              <p className="meta">Request a new password reset email and try again.</p>
              <p className="meta">
                <Link className="shell-inline-link" to="/forgot-password">
                  Request new reset link
                </Link>
              </p>
              <p className="meta">
                <Link className="shell-inline-link" to="/signin">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : null}

          {!isLoading && hasRecoverySession ? (
            <form className="shell-form" onSubmit={handleSubmit}>
              <p className="preference-meta">
                Already signed in? You can also use{" "}
                <Link className="shell-inline-link" to="/account/change-password">
                  Change password
                </Link>
                .
              </p>

              <label className="shell-label" htmlFor="reset-new-password">
                New password
              </label>
              <input
                className="shell-input"
                id="reset-new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />

              <label className="shell-label" htmlFor="reset-confirm-password">
                Confirm new password
              </label>
              <input
                className="shell-input"
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              {error ? <p className="native-form-message native-form-error">{error}</p> : null}
              {notice ? <p className="native-form-message native-form-success">{notice}</p> : null}

              <button className="shell-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating password..." : "Update password"}
              </button>
            </form>
          ) : null}
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
