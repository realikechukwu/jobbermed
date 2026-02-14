import { NavLink } from "react-router-dom";

export function FooterShell() {
  return (
    <footer className="footer-strip" aria-label="Footer">
      <div className="footer-inner">
        <NavLink className="footer-link" to="/">
          Home
        </NavLink>
        <NavLink className="footer-link" to="/native-jobs">
          Native Jobs
        </NavLink>
        <NavLink className="footer-link" to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink className="footer-link" to="/signin">
          Sign In
        </NavLink>
        <NavLink className="footer-link" to="/signup">
          Sign Up
        </NavLink>
      </div>
    </footer>
  );
}
