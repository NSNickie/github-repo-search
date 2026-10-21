import { PER_PAGE } from '../api/github';

/** GitHub search never returns results beyond the first 1,000. */
export const MAX_RESULTS = 1000;

/** Highest page the API will serve at our page size (page 35 returns HTTP 422). */
export const ABSOLUTE_MAX_PAGE = Math.ceil(MAX_RESULTS / PER_PAGE);

export type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

/** Number of reachable pages for a given `total_count`; always at least 1. */
export function getMaxPage(totalCount: number): number {
  const reachable = Math.min(Math.max(totalCount, 0), MAX_RESULTS);
  return Math.max(1, Math.ceil(reachable / PER_PAGE));
}

export function clampPage(page: number, maxPage: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(Math.trunc(page), 1), Math.max(maxPage, 1));
}

/**
 * Page buttons to render, e.g. `[1, 'start-ellipsis', 4, 5, 6, 7, 8, 'end-ellipsis', 34]`.
 *
 * First and last pages are always shown, plus `siblings` pages on each side of the current
 * one. A gap of exactly one page is filled with that page instead of an ellipsis, because an
 * ellipsis that hides a single number saves no space.
 */
export function getPageItems(current: number, maxPage: number, siblings = 2): PageItem[] {
  if (maxPage <= 1) return [1];
  const page = clampPage(current, maxPage);

  const start = Math.max(2, page - siblings);
  const end = Math.min(maxPage - 1, page + siblings);
  const items: PageItem[] = [1];

  if (start === 3) items.push(2);
  else if (start > 3) items.push('start-ellipsis');

  for (let p = start; p <= end; p += 1) items.push(p);

  if (end === maxPage - 2) items.push(maxPage - 1);
  else if (end < maxPage - 2) items.push('end-ellipsis');

  items.push(maxPage);
  return items;
}
