import type { Repo } from '../../api/types';
import { RepoCard } from '../RepoCard/RepoCard';
import styles from './RepoList.module.css';

interface RepoListProps {
  repos: Repo[];
  /** True while a newer page is loading and these items are the previous page. */
  stale: boolean;
}

export function RepoList({ repos, stale }: RepoListProps) {
  return (
    <ol className={`${styles.list} ${stale ? styles.stale : ''}`} aria-busy={stale}>
      {repos.map((repo) => (
        <li key={repo.id}>
          <RepoCard repo={repo} />
        </li>
      ))}
    </ol>
  );
}
