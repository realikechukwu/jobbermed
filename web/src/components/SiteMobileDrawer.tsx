import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { isSiteNavLinkActive, type SiteNavLink } from "../navigation/site-nav";

type SiteMobileDrawerVariant = "home" | "app";

type SiteMobileDrawerProps = {
  variant: SiteMobileDrawerVariant;
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  search?: string;
  email?: string;
  links: SiteNavLink[];
  showSignOut?: boolean;
  onSignOut?: () => Promise<void> | void;
};

const LINK_ICONS: Record<string, ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
    </svg>
  ),
  jobs: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  subscribe: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path fill="none" stroke="currentColor" strokeWidth="2" d="m3 7 9 6 9-6" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10-3h8v11h-8V10z" />
    </svg>
  ),
  recruiter: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z" />
    </svg>
  ),
  mdcn: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zm-1 14-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7z" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.4 13a7.8 7.8 0 0 0 .1-1 7.8 7.8 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.7l-2-3.4a.5.5 0 0 0-.6-.2l-2.5 1a7.6 7.6 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.4a.5.5 0 0 0 .1.7L4.5 11a7.8 7.8 0 0 0-.1 1 7.8 7.8 0 0 0 .1 1l-2.1 1.6a.5.5 0 0 0-.1.7l2 3.4c.1.2.4.3.6.2l2.5-1a7.6 7.6 0 0 0 1.7 1l.4 2.6c0 .3.2.5.5.5h4c.3 0 .5-.2.5-.5l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.4a.5.5 0 0 0-.1-.7L19.4 13zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"
      />
    </svg>
  ),
};

function DrawerLink({
  link,
  pathname,
  search,
  onClose,
  className,
}: {
  link: SiteNavLink;
  pathname: string;
  search?: string;
  onClose: () => void;
  className: string;
}) {
  const isActive = isSiteNavLinkActive(link, pathname, search);
  const fullClassName = `${className}${isActive ? " active" : ""}`;
  const icon = LINK_ICONS[link.id];

  const content = (
    <>
      {icon ? <span className="site-mobile-link-icon">{icon}</span> : null}
      {link.label}
    </>
  );

  if (link.kind === "external") {
    return (
      <a className={fullClassName} href={link.href} onClick={onClose}>
        {content}
      </a>
    );
  }

  return (
    <Link className={fullClassName} to={link.to} onClick={onClose}>
      {content}
    </Link>
  );
}

export function SiteMobileDrawer({
  variant,
  isOpen,
  onClose,
  pathname,
  search,
  email,
  links,
  showSignOut = false,
  onSignOut,
}: SiteMobileDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);
  useBodyScrollLock(isOpen);
  useFocusTrap(drawerRef, isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  function handleSignOutClick() {
    onClose();
    if (onSignOut) {
      void onSignOut();
    }
  }

  const primaryLinks = links.filter((link) => link.group === "primary");
  const accountLinks = links.filter((link) => link.group === "account");
  const legalLinks = links.filter((link) => link.group === "legal");
  const authLinks = links.filter((link) => link.group === "auth");

  const signInLink = authLinks.find((link) => link.id === "signin");
  const signUpLink = authLinks.find((link) => link.id === "signup");

  return (
    <>
      <div className={`site-mobile-overlay${isOpen ? " show" : ""}`} role="presentation" onClick={onClose} />

      <aside
        ref={drawerRef}
        className={`site-mobile-drawer site-mobile-drawer--${variant}${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={isOpen ? "false" : "true"}
      >
        <div className="site-mobile-header">
          <span className="site-mobile-brand">
            Jobber<span className="site-mobile-brand-accent">Med</span>
          </span>
          <button className="site-mobile-close" type="button" aria-label="Close menu" onClick={onClose}>
            ✕
          </button>
        </div>

        {email ? <div className="site-mobile-email">{email}</div> : null}

        <nav className="site-mobile-links" aria-label="Main">
          {primaryLinks.map((link) => (
            <DrawerLink key={link.id} link={link} pathname={pathname} search={search} onClose={onClose} className="site-mobile-link" />
          ))}
        </nav>

        {accountLinks.length > 0 ? (
          <>
            <div className="site-mobile-section-label" aria-hidden="true">
              Account
            </div>
            <nav className="site-mobile-links" aria-label="Account">
              {accountLinks.map((link) => (
                <DrawerLink key={link.id} link={link} pathname={pathname} search={search} onClose={onClose} className="site-mobile-link" />
              ))}
            </nav>
          </>
        ) : null}

        <div className="site-mobile-bottom">
          <nav className="site-mobile-legal" aria-label="About and legal">
            {legalLinks.map((link) => (
              <DrawerLink
                key={link.id}
                link={link}
                pathname={pathname}
                search={search}
                onClose={onClose}
                className="site-mobile-legal-link"
              />
            ))}
          </nav>

          {signUpLink || signInLink ? (
            <div className="site-mobile-auth">
              {signUpLink && signUpLink.kind === "internal" ? (
                <Link className="site-mobile-auth-btn site-mobile-auth-primary" to={signUpLink.to} onClick={onClose}>
                  {signUpLink.label}
                </Link>
              ) : null}
              {signInLink && signInLink.kind === "internal" ? (
                <Link className="site-mobile-auth-btn site-mobile-auth-secondary" to={signInLink.to} onClick={onClose}>
                  {signInLink.label}
                </Link>
              ) : null}
            </div>
          ) : null}

          {showSignOut ? (
            <button className="site-mobile-signout" type="button" onClick={handleSignOutClick}>
              Sign Out
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
