import type { SearchParams, SortKey, SortOrder } from '../../api/types';
import { LANGUAGES } from '../../utils/languages';
import styles from './Filters.module.css';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'best', label: 'Best match' },
  { value: 'stars', label: 'Most stars' },
  { value: 'forks', label: 'Most forks' },
  { value: 'updated', label: 'Recently updated' },
];

const ORDER_LABELS: Record<SortKey, { desc: string; asc: string }> = {
  best: { desc: 'Descending', asc: 'Ascending' },
  stars: { desc: 'Most first', asc: 'Fewest first' },
  forks: { desc: 'Most first', asc: 'Fewest first' },
  updated: { desc: 'Newest first', asc: 'Oldest first' },
};

interface FiltersProps {
  params: SearchParams;
  /** Any filter change starts again from page 1. */
  onChange: (patch: Partial<SearchParams>) => void;
}

export function Filters({ params, onChange }: FiltersProps) {
  const orderLabels = ORDER_LABELS[params.sort];

  return (
    <div className={styles.filters}>
      <label className={styles.control}>
        <span className={styles.label}>Sort</span>
        <select
          className={styles.select}
          value={params.sort}
          onChange={(event) => onChange({ sort: event.target.value as SortKey, page: 1 })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.control}>
        <span className={styles.label}>Order</span>
        <select
          className={styles.select}
          value={params.order}
          disabled={params.sort === 'best'}
          title={params.sort === 'best' ? 'Best match is always ordered by relevance' : undefined}
          onChange={(event) => onChange({ order: event.target.value as SortOrder, page: 1 })}
        >
          <option value="desc">{orderLabels.desc}</option>
          <option value="asc">{orderLabels.asc}</option>
        </select>
      </label>

      <label className={styles.control}>
        <span className={styles.label}>Language</span>
        <select
          className={styles.select}
          value={params.lang}
          onChange={(event) => onChange({ lang: event.target.value, page: 1 })}
        >
          <option value="">Any</option>
          {LANGUAGES.map((language) => (
            <option key={language.id} value={language.id}>
              {language.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
