import { Fragment } from "react";
import { Link } from "react-router-dom";
import { CV_MATCH_CTA, CV_MATCH_URL, parseInline, type ArticleBlock } from "./articles";

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((segment, index) => {
        if (!segment.href) {
          return <Fragment key={index}>{segment.text}</Fragment>;
        }

        // Site pages stay inside the app; everything else is a normal link.
        if (segment.href.startsWith("/")) {
          return (
            <Link key={index} to={segment.href}>
              {segment.text}
            </Link>
          );
        }

        return (
          <a key={index} href={segment.href}>
            {segment.text}
          </a>
        );
      })}
    </>
  );
}

export function CvMatchCta() {
  return (
    <aside className="cv-cta" aria-label="CV Match">
      <strong className="cv-cta-heading">{CV_MATCH_CTA.heading}</strong>
      <p>{CV_MATCH_CTA.text}</p>
      <a className="cv-cta-button" href={CV_MATCH_URL}>
        {CV_MATCH_CTA.button}
      </a>
    </aside>
  );
}

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return <h2 key={index}>{block.text}</h2>;
          case "h3":
            return <h3 key={index}>{block.text}</h3>;
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List key={index}>
                {block.items.map((item) => (
                  <li key={item}>
                    <Inline text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "table":
            return (
              <table className="blog-table" key={index}>
                <thead>
                  <tr>
                    {block.columns.map((column) => <th key={column} scope="col">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map(([label, text]) => (
                    <tr key={label}>
                      <th scope="row"><Inline text={label} /></th>
                      <td><Inline text={text} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          case "example":
            return (
              <blockquote key={index} className="blog-example">
                {block.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </blockquote>
            );
          case "cta":
            return <CvMatchCta key={index} />;
          default:
            return (
              <p key={index}>
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </>
  );
}
