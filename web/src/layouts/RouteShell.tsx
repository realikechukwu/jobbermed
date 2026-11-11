import type { ReactNode } from "react";
import { FooterShell } from "../components/FooterShell";
import { HeroShell } from "../components/HeroShell";
import { TopStrip } from "../components/TopStrip";

type RouteShellProps = {
  title: string;
  className?: string;
  heroContent?: ReactNode;
  subtitle?: string;
  children: ReactNode;
};

export function RouteShell({ title, subtitle, children, className, heroContent }: RouteShellProps) {
  return (
    <div className={className}>
      <TopStrip />
      <HeroShell title={title} subtitle={subtitle} content={heroContent} variant="compact" />
      <div className="page">{children}</div>
      <FooterShell />
    </div>
  );
}
