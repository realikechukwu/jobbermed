import { ArticleCard } from "../features/blog/ArticleCard";
import { ARTICLES, BLOG_INDEX_META } from "../features/blog/articles";
import { CvMatchCta } from "../features/blog/ArticleBody";
import { RouteShell } from "../layouts/RouteShell";
import "../styles/blog.css";

export function BlogIndexPage() {
  return (
    <RouteShell className="blog-shell" title={BLOG_INDEX_META.heading} subtitle={BLOG_INDEX_META.intro}>
      <section className="shell-content blog-index" aria-label="Career guides">
        <ul className="blog-list">
          {ARTICLES.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </ul>
        <CvMatchCta />
      </section>
    </RouteShell>
  );
}
