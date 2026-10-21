import { useState, type FormEvent } from 'react';
import { MAX_QUERY_LENGTH } from '../../utils/searchParams';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  /** Current query from the URL. The parent remounts this component (via `key`) when it changes. */
  initialValue: string;
  onSearch: (query: string) => void;
}

export function SearchBar({ initialValue, onSearch }: SearchBarProps) {
  const [draft, setDraft] = useState(initialValue);
  const trimmed = draft.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <form className={styles.form} role="search" onSubmit={handleSubmit}>
      <label htmlFor="search-input" className="visually-hidden">
        Search repositories
      </label>
      <div className={styles.field}>
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M10.68 11.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04ZM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z" />
        </svg>
        <input
          id="search-input"
          className={styles.input}
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search repositories, e.g. react state management"
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
        />
      </div>
      <button className={styles.button} type="submit" disabled={!trimmed}>
        Search
      </button>
    </form>
  );
}
