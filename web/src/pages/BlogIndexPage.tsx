import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AggregatorPagination } from "../features/aggregator-jobs/components/AggregatorPagination";
import { ArticleCard } from "../features/blog/ArticleCard";
import { ARTICLES, BLOG_INDEX_META } from "../features/blog/articles";
import { CvMatchCta } from "../features/blog/ArticleBody";
import { RouteShell } from "../layouts/RouteShell";
import "../styles/blog.css";

const ARTICLES_PER_PAGE = 6;

export function BlogIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(ARTICLES.length / ARTICLES_PER_PAGE));
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const pageArticles = ARTICLES.slice((currentPage - 1) * ARTICLES_PER_PAGE, currentPage * ARTICLES_PER_PAGE);

  // Scroll back to the top of the list when the page changes, not on first load.
  useEffect(() => {
    if (currentPage > 1 || searchParams.has("page")) {
      document.getElementById("career-guides")?.scrollIntoView({ block: "start" });
    }
  }, [currentPage, searchParams]);

  function handlePageChange(nextPage: number) {
    setSearchParams(nextPage <= 1 ? {} : { page: String(nextPage) });
  }

  return (
    <RouteShell className="blog-shell" title={BLOG_INDEX_META.heading} subtitle={BLOG_INDEX_META.intro}>
      <section className="shell-content blog-index" id="career-guides" aria-label="Career guides">
        <ul className="blog-list">
          {pageArticles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </ul>
        <AggregatorPagination
          id="blog-pagination"
          ariaLabel="Career guides pagination"
          currentPage={currentPage}
          totalPages={totalPages}
          includeNumbers
          onPageChange={handlePageChange}
        />
        <CvMatchCta />
      </section>
    </RouteShell>
  );
}
