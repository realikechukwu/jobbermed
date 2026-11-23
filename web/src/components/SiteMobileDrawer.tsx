import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { captureSubscribeLinkClick } from "../features/newsletter/analytics";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { handleDialogBackdropClickFallback } from "../lib/form-accessibility";
import { isSiteNavLinkActive, type SiteNavLink } from "../navigation/site-nav";

type SiteMobileDrawerVariant = "home" | "app";

type SiteMobileDrawerProps = {
  id?: string;
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

  if (link.kind === "external") {
    return (
      <a className={fullClassName} href={link.href} onClick={onClose}>
        {link.label}
      </a>
    );
  }

  return (
    <Link className={fullClassName} to={link.to} onClick={() => {
      if (link.id === "subscribe-mobile") captureSubscribeLinkClick("mobile_drawer");
      onClose();
    }}>
      {link.label}
    </Link>
  );
}

export function SiteMobileDrawer({
  id = "site-mobile-drawer",
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

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
    <dialog
      ref={dialogRef}
      id={id}
      className={`site-mobile-drawer site-mobile-drawer--${variant}${isOpen ? " open" : ""}`}
      aria-label="Site menu"
      onClose={onClose}
      onClick={(event) => handleDialogBackdropClickFallback(event, onClose)}
      {...({ closedby: "any" } as Record<string, string>)}
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
    </dialog>
  );
}
