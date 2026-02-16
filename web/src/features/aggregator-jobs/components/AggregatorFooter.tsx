import { Link } from "react-router-dom";
import { useSession } from "../../auth/session-context";

export function AggregatorFooter() {
  const { user } = useSession();

  return (
    <footer className="footer-strip" aria-label="Footer">
      <div className="footer-inner">
        <Link className="footer-link" to="/">
          Home
        </Link>

        {user ? (
          <Link className="footer-link" to="/dashboard">
            Dashboard
          </Link>
        ) : null}

        <a className="footer-link" href="https://jobbermed.com/about.html">
          About Us
        </a>

        <a className="footer-link" href="https://jobbermed.com/privacy.html">
          Privacy Policy
        </a>

        <Link className="footer-link" to="/native-jobs">
          Subscribe to Newsletter
        </Link>

        {!user ? (
          <Link className="footer-link" to="/signup">
            Sign Up
          </Link>
        ) : null}
      </div>
    </footer>
  );
}
