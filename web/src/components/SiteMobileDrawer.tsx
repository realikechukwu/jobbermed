import { useEffect, useRef } from "react";
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
  primaryLink?: SiteNavLink | null;
  links: SiteNavLink[];
  supplementalLink?: SiteNavLink | null;
  showSignOut?: boolean;
  onSignOut?: () => Promise<void> | void;
};

function LinkEntry({
  link,
  pathname,
  search,
  onClose,
  extraClassName,
}: {
  link: SiteNavLink;
  pathname: string;
  search?: string;
  onClose: () => void;
  extraClassName?: string;
}) {
  const isActive = isSiteNavLinkActive(link, pathname, search);
  const className = `site-mobile-link${isActive ? " active" : ""}${extraClassName ? ` ${extraClassName}` : ""}`;

  if (link.kind === "external") {
    return (
      <a className={className} href={link.href} onClick={onClose}>
        {link.label}
      </a>
    );
  }

  return (
    <Link className={className} to={link.to} onClick={onClose}>
      {link.label}
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
  primaryLink,
  links,
  supplementalLink,
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

  return (
    <>
      <div className={`site-mobile-overlay${isOpen ? " show" : ""}`} role="presentation" onClick={onClose} />

      <aside
        ref={drawerRef}
        className={`site-mobile-drawer site-mobile-drawer--${variant}${isOpen ? " open" : ""}`}
        aria-hidden={isOpen ? "false" : "true"}
      >
        <button className="site-mobile-close" type="button" aria-label="Close menu" onClick={onClose}>
          ✕
        </button>

        {email ? <div className="site-mobile-email">{email}</div> : null}

        {primaryLink ? (
          <LinkEntry link={primaryLink} pathname={pathname} search={search} onClose={onClose} extraClassName="site-mobile-primary" />
        ) : null}

        <nav className="site-mobile-links">
          {links.map((link) => (
            <LinkEntry key={link.id} link={link} pathname={pathname} search={search} onClose={onClose} />
          ))}
        </nav>

        {supplementalLink ? <LinkEntry link={supplementalLink} pathname={pathname} search={search} onClose={onClose} /> : null}

        {showSignOut ? (
          <button className="site-mobile-signout" type="button" onClick={handleSignOutClick}>
            Sign Out
          </button>
        ) : null}
      </aside>
    </>
  );
}
