import type { SearchParams, SortKey, SortOrder } from '../api/types';
import { findLanguage } from './languages';
import { ABSOLUTE_MAX_PAGE, clampPage } from './pagination';

export const DEFAULT_PARAMS: SearchParams = {
  q: '',
  sort: 'best',
  order: 'desc',
  lang: '',
  page: 1,
};

const SORT_KEYS: readonly SortKey[] = ['best', 'stars', 'forks', 'updated'];
/** GitHub ignores characters beyond this for the free-text part of a query. */
export const MAX_QUERY_LENGTH = 256;

function isSortKey(value: string | null): value is SortKey {
  return SORT_KEYS.includes(value as SortKey);
}

/**
 * Reads search state from a query string. Anything unknown or malformed falls back to a
 * default, so a hand-edited URL can never put the app into an invalid state.
 */
export function parseSearchParams(search: string): SearchParams {
  const query = new URLSearchParams(search);
  const sort = query.get('sort');
  const order = query.get('order');
  const lang = query.get('lang') ?? '';
  const page = Number.parseInt(query.get('page') ?? '', 10);

  return {
    q: (query.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    sort: isSortKey(sort) ? sort : DEFAULT_PARAMS.sort,
    order: (order === 'asc' ? 'asc' : 'desc') satisfies SortOrder,
    lang: findLanguage(lang) ? lang : '',
    // Without a total yet we only know the hard API ceiling; App clamps further once data arrives.
    page: Number.isNaN(page) ? 1 : clampPage(page, ABSOLUTE_MAX_PAGE),
  };
}

/** Inverse of parseSearchParams. Defaults are omitted to keep shared links short. */
export function serializeSearchParams(params: SearchParams): string {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.sort !== DEFAULT_PARAMS.sort) {
    query.set('sort', params.sort);
    if (params.order !== DEFAULT_PARAMS.order) query.set('order', params.order);
  }
  if (params.lang) query.set('lang', params.lang);
  if (params.page !== DEFAULT_PARAMS.page) query.set('page', String(params.page));

  const result = query.toString();
  return result ? `?${result}` : '';
}
