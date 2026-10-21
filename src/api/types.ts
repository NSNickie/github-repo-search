/** Subset of the GitHub "repository search result item" we actually render. */
export interface Repo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repo[];
}

export type SortKey = 'best' | 'stars' | 'forks' | 'updated';
export type SortOrder = 'desc' | 'asc';

/** Everything that defines one search; mirrors the URL query string. */
export interface SearchParams {
  q: string;
  sort: SortKey;
  order: SortOrder;
  /** Language id from LANGUAGES, or '' for any language. */
  lang: string;
  page: number;
}
