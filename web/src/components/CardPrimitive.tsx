import type { ReactNode } from "react";

type CardPrimitiveProps = {
  title: string;
  meta?: string;
  children?: ReactNode;
};

export function CardPrimitive({ title, meta, children }: CardPrimitiveProps) {
  return (
    <article className="card">
      <h2 className="title">{title}</h2>
      {meta ? <p className="meta">{meta}</p> : null}
      {children}
    </article>
  );
}
