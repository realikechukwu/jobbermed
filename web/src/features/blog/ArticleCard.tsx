import { Link } from "react-router-dom";
import { formatArticleDate, type Article } from "./articles";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <li className="blog-card">
      <Link className="blog-card-link" to={`/blog/${article.slug}`}>
        <img className="blog-card-image" src={article.image} alt="" width="640" height="420" loading="lazy" />
        <div className="blog-card-copy">
          <span className="blog-category">{article.category}</span>
          <h2 className="blog-card-title">{article.title}</h2>
          <p className="blog-card-description">{article.description}</p>
          <p className="blog-meta">{formatArticleDate(article.published)} · {article.readMinutes} min read</p>
          <span className="blog-read-link">Read guide <span aria-hidden="true">↗</span></span>
        </div>
      </Link>
    </li>
  );
}
