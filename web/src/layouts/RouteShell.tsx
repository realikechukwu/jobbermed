import type { ReactNode } from "react";
import { FooterShell } from "../components/FooterShell";
import { HeroShell } from "../components/HeroShell";
import { TopStrip } from "../components/TopStrip";

type RouteShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function RouteShell({ title, subtitle, children }: RouteShellProps) {
  return (
    <>
      <TopStrip />
      <HeroShell title={title} subtitle={subtitle} variant="compact" />
      <div className="page">{children}</div>
      <FooterShell />
    </>
  );
}
