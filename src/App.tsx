import { useEffect, useRef, type MouseEvent } from 'react';
import { NetworkError, RateLimitError, ValidationError } from './api/errors';
import { Filters } from './components/Filters/Filters';
import { Pagination } from './components/Pagination/Pagination';
import { RepoList } from './components/RepoList/RepoList';
import { SearchBar } from './components/SearchBar/SearchBar';
import { Skeleton } from './components/Skeleton/Skeleton';
import { Notice, StatusMessage } from './components/StatusMessage/StatusMessage';
import { useCountdown } from './hooks/useCountdown';
import { useRepoSearch } from './hooks/useRepoSearch';
import { useSearchParamsState, type SetSearchParams } from './hooks/useSearchParamsState';
import { formatNumber } from './utils/format';
import { MAX_RESULTS, getMaxPage } from './utils/pagination';
import styles from './App.module.css';

const EXAMPLE_QUERIES = ['react', 'tetris', 'machine learning', 'awesome'];
const APP_TITLE = 'GitHub Repo Search';

export default function App() {
  const [params, setParams] = useSearchParamsState();
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useRepoSearch(params);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const hasQuery = params.q !== '';
  // Only trust the total once it belongs to the current query (not a placeholder from before).
  const maxPage = data && !isPlaceholderData ? getMaxPage(data.total_count) : null;
  const page = maxPage === null ? params.page : Math.min(params.page, maxPage);

  // A shared link may point beyond the last page (e.g. ?page=34 for a 2-page result).
  useEffect(() => {
    if (maxPage !== null && params.page > maxPage) {
      setParams({ page: maxPage }, { replace: true });
    }
  }, [maxPage, params.page, setParams]);

  useEffect(() => {
    document.title = params.q ? `${params.q} · ${APP_TITLE}` : APP_TITLE;
  }, [params.q]);

  const search = (q: string) => setParams({ q, page: 1 });

  const goToPage = (nextPage: number) => {
    setParams({ page: nextPage });
    // Bring the top of the list into view and move focus there for keyboard/screen-reader users.
    const heading = resultsHeadingRef.current;
    heading?.scrollIntoView?.({ block: 'start' });
    heading?.focus({ preventScroll: true });
  };

  const renderResults = () => {
    if (!hasQuery) {
      return (
        <StatusMessage title="Find your next favourite repository">
          <p>Search public GitHub repositories by name, description or topic.</p>
          <p className={styles.examples}>
            Try:{' '}
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                className={styles.chip}
                onClick={() => search(example)}
              >
                {example}
              </button>
            ))}
          </p>
        </StatusMessage>
      );
    }

    if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
    if (isPending || !data) return <Skeleton />;

    if (data.total_count === 0) {
      return (
        <StatusMessage title="No repositories found">
          <p>
            Nothing matches <strong>“{params.q}”</strong>
            {params.lang ? ' in the selected language' : ''}. Try fewer or different keywords
            {params.lang ? ', or set Language to Any' : ''}.
          </p>
        </StatusMessage>
      );
    }

    const lastPage = maxPage ?? getMaxPage(data.total_count);

    return (
      <section className={styles.results} aria-labelledby="results-heading">
        <div className={styles.resultsHeader}>
          <h2
            id="results-heading"
            ref={resultsHeadingRef}
            className={styles.resultsTitle}
            tabIndex={-1}
          >
            {formatNumber(data.total_count)}{' '}
            {data.total_count === 1 ? 'repository' : 'repositories'}
          </h2>
          <span className={styles.pageInfo}>
            Page {page} of {lastPage}
          </span>
        </div>

        {data.incomplete_results && (
          <Notice>GitHub stopped this search early, so some results may be missing.</Notice>
        )}

        <RepoList repos={data.items} stale={isPlaceholderData} />

        <Pagination page={page} maxPage={lastPage} onPageChange={goToPage} />

        {data.total_count > MAX_RESULTS && (
          <p className={styles.cap}>
            Only the first {formatNumber(MAX_RESULTS)} results are available through the GitHub API.
            Narrow your search to see more specific matches.
          </p>
        )}
      </section>
    );
  };

  const liveMessage = !hasQuery
    ? ''
    : isFetching
      ? 'Loading results…'
      : data && maxPage !== null
        ? `${formatNumber(data.total_count)} repositories found. Page ${page} of ${maxPage}.`
        : '';

  return (
    <>
      {hasQuery && isFetching && <div className={styles.progress} aria-hidden="true" />}

      <header className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>
            <a href="./" onClick={(event) => handleHomeClick(event, setParams)}>
              {APP_TITLE}
            </a>
          </h1>
          <p className={styles.subtitle}>Explore public repositories on GitHub.</p>
          {/* Remount when the URL query changes (e.g. browser Back) so the input follows it. */}
          <SearchBar key={params.q} initialValue={params.q} onSearch={search} />
          <div className={styles.filters}>
            <Filters params={params} onChange={(patch) => setParams(patch)} />
          </div>
        </div>
      </header>

      <main className={styles.container}>
        <p className="visually-hidden" aria-live="polite">
          {liveMessage}
        </p>
        {renderResults()}
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          Data from the{' '}
          <a href="https://docs.github.com/en/rest/search/search" target="_blank" rel="noreferrer">
            GitHub REST API
          </a>
          . Without signing in, GitHub allows 10 searches per minute.
        </div>
      </footer>
    </>
  );
}

function handleHomeClick(event: MouseEvent<HTMLAnchorElement>, setParams: SetSearchParams) {
  // Let modifier-clicks open a new tab as usual.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  setParams({ q: '', sort: 'best', order: 'desc', lang: '', page: 1 });
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const resetAt = error instanceof RateLimitError ? error.resetAt : null;
  const secondsLeft = useCountdown(resetAt);

  const retryButton = (
    <button type="button" className={styles.retry} onClick={onRetry}>
      Retry
    </button>
  );

  if (error instanceof RateLimitError) {
    return (
      <StatusMessage
        tone="error"
        title="Rate limit reached"
        action={secondsLeft === 0 ? retryButton : undefined}
      >
        <p>
          GitHub allows 10 searches per minute without signing in.{' '}
          {secondsLeft > 0 ? (
            <>
              Try again in <strong className={styles.countdown}>{secondsLeft}s</strong>.
            </>
          ) : (
            'You can try again now.'
          )}
        </p>
      </StatusMessage>
    );
  }

  if (error instanceof ValidationError) {
    return (
      <StatusMessage tone="error" title="Invalid search query">
        <p>GitHub could not process this search: {error.message}</p>
        <p>Check for unbalanced quotes or unsupported qualifiers and try again.</p>
      </StatusMessage>
    );
  }

  if (error instanceof NetworkError) {
    return (
      <StatusMessage tone="error" title="Network error" action={retryButton}>
        <p>Could not reach GitHub. Check your connection and try again.</p>
      </StatusMessage>
    );
  }

  return (
    <StatusMessage tone="error" title="Something went wrong" action={retryButton}>
      <p>{error.message}</p>
    </StatusMessage>
  );
}
