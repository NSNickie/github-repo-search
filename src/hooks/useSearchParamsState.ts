import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { SearchParams } from '../api/types';
import { parseSearchParams, serializeSearchParams } from '../utils/searchParams';

/** pushState/replaceState do not fire events, so we announce our own changes. */
const URL_CHANGE_EVENT = 'app:urlchange';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(URL_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(URL_CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): string {
  return window.location.search;
}

export interface NavigateOptions {
  /** Replace the current history entry instead of adding one (used for corrections). */
  replace?: boolean;
}

export type SetSearchParams = (patch: Partial<SearchParams>, options?: NavigateOptions) => void;

function writeUrl(search: string, replace: boolean): void {
  if (search === window.location.search) return;
  const url = `${window.location.pathname}${search}${window.location.hash}`;
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  window.dispatchEvent(new Event(URL_CHANGE_EVENT));
}

/**
 * The URL is the single source of truth for search state: reading goes through
 * `useSyncExternalStore`, writing goes through the History API. This gives refresh-safe,
 * shareable links and working back/forward buttons for free.
 */
export function useSearchParamsState(): [SearchParams, SetSearchParams] {
  const search = useSyncExternalStore(subscribe, getSnapshot);
  const params = useMemo(() => parseSearchParams(search), [search]);

  // Rewrite malformed or non-canonical URLs (e.g. ?page=abc) without adding a history entry.
  useEffect(() => {
    writeUrl(serializeSearchParams(params), true);
  }, [params]);

  const setParams = useCallback<SetSearchParams>((patch, options = {}) => {
    const next = { ...parseSearchParams(window.location.search), ...patch };
    writeUrl(serializeSearchParams(next), options.replace ?? false);
  }, []);

  return [params, setParams];
}
