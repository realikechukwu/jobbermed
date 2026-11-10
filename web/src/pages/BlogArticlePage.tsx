import { Link, useParams } from "react-router-dom";
import { ARTICLES, formatArticleDate, getArticle } from "../features/blog/articles";
import { ArticleBody } from "../features/blog/ArticleBody";
import { RouteShell } from "../layouts/RouteShell";
import { NotFoundPage } from "./NotFoundPage";
import "../styles/blog.css";

export function BlogArticlePage() {
  const { articleSlug } = useParams();
  const article = getArticle(articleSlug);

  if (!article) {
    return <NotFoundPage />;
  }

  const others = ARTICLES.filter((other) => other.slug !== article.slug);

  return (
    <RouteShell
      title={article.title}
      subtitle={`${formatArticleDate(article.published)} · ${article.readMinutes} min read`}
    >
      <section className="shell-content" aria-label={article.title}>
        <article className="card blog-article">
          <ArticleBody blocks={article.body} />
        </article>

        <nav className="blog-more" aria-label="More career guides">
          <h2>More career guides</h2>
          <ul>
            {others.map((other) => (
              <li key={other.slug}>
                <Link to={`/blog/${other.slug}`}>{other.title}</Link>
              </li>
            ))}
          </ul>
          <p>
            <Link to="/">Browse healthcare jobs</Link>
          </p>
        </nav>
      </section>
    </RouteShell>
  );
}
