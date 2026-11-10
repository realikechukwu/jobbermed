import { Link } from "react-router-dom";
import { ARTICLES, BLOG_INDEX_META, formatArticleDate } from "../features/blog/articles";
import { CvMatchCta } from "../features/blog/ArticleBody";
import { RouteShell } from "../layouts/RouteShell";
import "../styles/blog.css";

export function BlogIndexPage() {
  return (
    <RouteShell title={BLOG_INDEX_META.heading} subtitle={BLOG_INDEX_META.intro}>
      <section className="shell-content blog-index" aria-label="Career guides">
        <ul className="blog-list">
          {ARTICLES.map((article) => (
            <li key={article.slug} className="card blog-card">
              <h2 className="blog-card-title">
                <Link to={`/blog/${article.slug}`}>{article.title}</Link>
              </h2>
              <p className="blog-card-description">{article.description}</p>
              <p className="blog-meta">{`${formatArticleDate(article.published)} · ${article.readMinutes} min read`}</p>
            </li>
          ))}
        </ul>
        <CvMatchCta />
      </section>
    </RouteShell>
  );
}
