import type { Repo } from '../../api/types';
import { formatCompact, formatNumber, formatRelativeTime } from '../../utils/format';
import { getLanguageColor } from '../../utils/languages';
import styles from './RepoCard.module.css';

export function RepoCard({ repo }: { repo: Repo }) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <img
          className={styles.avatar}
          src={`${repo.owner.avatar_url}${repo.owner.avatar_url.includes('?') ? '&' : '?'}s=64`}
          alt=""
          width={32}
          height={32}
          loading="lazy"
        />
        <h3 className={styles.title}>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
            {repo.full_name}
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </h3>
      </header>

      {repo.description && <p className={styles.description}>{repo.description}</p>}

      <ul className={styles.meta}>
        <li title={`${formatNumber(repo.stargazers_count)} stars`}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
          </svg>
          <span className="visually-hidden">Stars: </span>
          {formatCompact(repo.stargazers_count)}
        </li>
        <li title={`${formatNumber(repo.forks_count)} forks`}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
          </svg>
          <span className="visually-hidden">Forks: </span>
          {formatCompact(repo.forks_count)}
        </li>
        {repo.language && (
          <li>
            <span
              className={styles.dot}
              style={{ backgroundColor: getLanguageColor(repo.language) }}
              aria-hidden="true"
            />
            <span className="visually-hidden">Language: </span>
            {repo.language}
          </li>
        )}
        <li>
          <time dateTime={repo.updated_at} title={new Date(repo.updated_at).toLocaleString()}>
            Updated {formatRelativeTime(repo.updated_at)}
          </time>
        </li>
      </ul>
    </article>
  );
}
