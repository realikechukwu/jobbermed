import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CardPrimitive } from "../components/CardPrimitive";
import { useSession } from "../features/auth/session-context";
import { RouteShell } from "../layouts/RouteShell";
import { getSupabaseClient } from "../lib/supabase-client";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!user) {
      setError("Sign in required.");
      return;
    }

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
      const normalizedCurrentPassword = currentPassword.trim();
      if (normalizedCurrentPassword) {
        if (!user.email) {
          setError("Unable to verify current password. Use Forgot password instead.");
          return;
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: normalizedCurrentPassword,
        });

        if (verifyError) {
          setError("Current password is incorrect.");
          return;
        }
      }

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
    <RouteShell title="Change password" subtitle="Update your password while signed in.">
      <section className="shell-content" aria-label="Change password">
        <CardPrimitive title="Change password">
          <form className="shell-form" onSubmit={handleSubmit}>
            <label className="shell-label" htmlFor="change-current-password">
              Current password (Recommended)
            </label>
            <input
              className="shell-input"
              id="change-current-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />

            <label className="shell-label" htmlFor="change-new-password">
              New password
            </label>
            <input
              className="shell-input"
              id="change-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />

            <label className="shell-label" htmlFor="change-confirm-password">
              Confirm new password
            </label>
            <input
              className="shell-input"
              id="change-confirm-password"
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

          <p className="meta auth-aux-link">
            Can't remember your password? <Link to="/forgot-password">Use reset email</Link>
          </p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}
