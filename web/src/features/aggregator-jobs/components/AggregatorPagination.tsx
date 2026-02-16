type AggregatorPaginationProps = {
  id: string;
  ariaLabel: string;
  currentPage: number;
  totalPages: number;
  includeNumbers: boolean;
  onPageChange: (nextPage: number) => void;
};

function buildVisiblePages(totalPages: number, currentPage: number): Array<number | "dots"> {
  if (totalPages <= 1) {
    return [];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: Array<number | "dots"> = [1];

  if (currentPage > 3) {
    tokens.push("dots");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    tokens.push(page);
  }

  if (currentPage < totalPages - 2) {
    tokens.push("dots");
  }

  tokens.push(totalPages);
  return tokens;
}

export function AggregatorPagination({
  id,
  ariaLabel,
  currentPage,
  totalPages,
  includeNumbers,
  onPageChange,
}: AggregatorPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageTokens = includeNumbers ? buildVisiblePages(totalPages, currentPage) : [];

  return (
    <div className="pagination" id={id} aria-label={ariaLabel}>
      <button
        className="pagination-btn"
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Prev
      </button>

      <span className="pagination-status">{`${currentPage} / ${totalPages}`}</span>

      <button
        className="pagination-btn"
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>

      {includeNumbers ? (
        <div className="pagination-numbers">
          {pageTokens.map((token, index) => {
            if (token === "dots") {
              return (
                <span key={`dots-${index}`} className="pagination-dots" aria-hidden="true">
                  ...
                </span>
              );
            }

            const isActive = token === currentPage;
            return (
              <button
                key={token}
                className={`pagination-num${isActive ? " active" : ""}`}
                type="button"
                disabled={isActive}
                onClick={() => onPageChange(token)}
              >
                {token}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
