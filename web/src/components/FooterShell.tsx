import { NavLink } from "react-router-dom";
import { useSession } from "../features/auth/session-context";

export function FooterShell() {
  const { user, hasRole, isLoading } = useSession();

  const showRecruiterLink = !isLoading && user && (hasRole("recruiter") || hasRole("admin"));
  const showMdcnLink = !isLoading && user && (hasRole("mdcn_official") || hasRole("admin"));
  const showAdminLink = !isLoading && user && hasRole("admin");

  return (
    <footer className="footer-strip" aria-label="Footer">
      <div className="footer-inner">
        <NavLink className="footer-link" to="/">
          Home
        </NavLink>
        <NavLink className="footer-link" to="/native-jobs">
          Native Jobs
        </NavLink>
        {user ? (
          <NavLink className="footer-link" to="/dashboard">
            Dashboard
          </NavLink>
        ) : null}
        {showRecruiterLink ? (
          <NavLink className="footer-link" to="/recruiter">
            Recruiter
          </NavLink>
        ) : null}
        {showMdcnLink ? (
          <NavLink className="footer-link" to="/mdcn">
            MDCN
          </NavLink>
        ) : null}
        {showAdminLink ? (
          <NavLink className="footer-link" to="/admin">
            Admin
          </NavLink>
        ) : null}
        {!user ? (
          <>
            <NavLink className="footer-link" to="/signin">
              Sign In
            </NavLink>
            <NavLink className="footer-link" to="/signup">
              Sign Up
            </NavLink>
          </>
        ) : null}
      </div>
    </footer>
  );
}
