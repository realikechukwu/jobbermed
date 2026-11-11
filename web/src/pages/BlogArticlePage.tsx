import { Link, useParams } from "react-router-dom";
import { ARTICLES, formatArticleDate, getArticle } from "../features/blog/articles";
import { ArticleCard } from "../features/blog/ArticleCard";
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
      className="blog-shell"
      title={article.title}
      heroContent={
        <>
          <Link className="blog-back" to="/blog">← All career guides</Link>
          <div className="blog-hero">
            <div className="blog-hero-copy">
              <span className="blog-category">{article.category}</span>
              <h1 className="hero-title">{article.title}</h1>
              <p className="hero-subtitle">{formatArticleDate(article.published)} · {article.readMinutes} min read</p>
            </div>
            <img className="blog-hero-image" src={article.image} alt="" width="640" height="420" fetchPriority="high" />
          </div>
        </>
      }
      subtitle={`${formatArticleDate(article.published)} · ${article.readMinutes} min read`}
    >
      <section className="shell-content blog-content" aria-label={article.title}>
        <article className="blog-article">
          <ArticleBody blocks={article.body} />
        </article>

        <nav className="blog-more" aria-label="More career guides">
          <h2>More career guides</h2>
          <ul className="blog-list">
            {others.map((other) => (
              <ArticleCard key={other.slug} article={other} />
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
