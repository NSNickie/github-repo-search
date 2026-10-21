import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getPageItems } from '../../utils/pagination';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  maxPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, maxPage, onPageChange }: PaginationProps) {
  // Fewer page buttons on narrow screens so the bar fits on one line.
  const isNarrow = useMediaQuery('(max-width: 640px)');
  if (maxPage <= 1) return null;

  const items = getPageItems(page, maxPage, isNarrow ? 1 : 2);

  return (
    <nav className={styles.nav} aria-label="Pagination">
      <button
        type="button"
        className={`${styles.button} ${styles.step}`}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <span aria-hidden="true">‹</span> Prev
      </button>

      <ol className={styles.pages}>
        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                className={styles.button}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                disabled={item === page}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} className={styles.ellipsis} aria-hidden="true">
              …
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        className={`${styles.button} ${styles.step}`}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= maxPage}
        aria-label="Next page"
      >
        Next <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
