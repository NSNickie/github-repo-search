import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RateLimitError, ValidationError } from '../api/errors';
import { searchRepos } from '../api/github';
import type { SearchParams } from '../api/types';

export const repoSearchKey = (params: SearchParams) => ['repos', params] as const;

/**
 * Anonymous search is limited to 10 requests per minute, so every option here leans towards
 * spending as few requests as possible.
 */
export function useRepoSearch(params: SearchParams) {
  return useQuery({
    queryKey: repoSearchKey(params),
    // `signal` aborts the request when the key changes, so a slow old page can't win a race.
    queryFn: ({ signal }) => searchRepos(params, signal),
    enabled: params.q !== '',
    // Search results barely change within minutes; revisiting a page should be free.
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    // Keep showing the previous page while the next one loads (no blank flash).
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    // Retrying a rate limit burns more quota, and a bad query stays bad. Retry others once.
    retry: (failureCount, error) =>
      !(error instanceof RateLimitError || error instanceof ValidationError) && failureCount < 1,
  });
}
