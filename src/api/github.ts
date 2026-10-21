import { findLanguage } from '../utils/languages';
import { ApiError, NetworkError, RateLimitError, ValidationError } from './errors';
import type { SearchParams, SearchResponse } from './types';

export const API_URL = 'https://api.github.com/search/repositories';
export const PER_PAGE = 30;

/** Used when GitHub signals a rate limit but sends no usable reset time. */
const FALLBACK_WAIT_MS = 60_000;

export function buildSearchUrl(params: SearchParams): string {
  const language = findLanguage(params.lang);
  const q = language ? `${params.q} language:${language.query}` : params.q;

  const query = new URLSearchParams({ q });
  if (params.sort !== 'best') {
    query.set('sort', params.sort);
    query.set('order', params.order);
  }
  query.set('per_page', String(PER_PAGE));
  query.set('page', String(params.page));
  return `${API_URL}?${query.toString()}`;
}

/** Prefer `retry-after` (seconds); otherwise use `x-ratelimit-reset` (epoch seconds). */
function getRetryAt(headers: Headers, now: number): number {
  const retryAfter = Number(headers.get('retry-after'));
  if (headers.has('retry-after') && Number.isFinite(retryAfter)) {
    return now + retryAfter * 1000;
  }
  const reset = Number(headers.get('x-ratelimit-reset'));
  if (headers.has('x-ratelimit-reset') && Number.isFinite(reset) && reset * 1000 > now) {
    return reset * 1000;
  }
  return now + FALLBACK_WAIT_MS;
}

interface GitHubErrorBody {
  message?: string;
  errors?: Array<{ message?: string }>;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as GitHubErrorBody;
    return body.errors?.[0]?.message ?? body.message ?? response.statusText;
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

/** Turns a non-2xx response into one of our typed errors so the UI can react precisely. */
export async function toApiError(response: Response, now = Date.now()): Promise<Error> {
  const message = await readErrorMessage(response);
  const { status, headers } = response;

  const isRateLimited =
    status === 429 ||
    (status === 403 &&
      (headers.get('x-ratelimit-remaining') === '0' ||
        headers.has('retry-after') ||
        /rate limit/i.test(message)));

  if (isRateLimited) return new RateLimitError(getRetryAt(headers, now), message);
  if (status === 422) return new ValidationError(message);
  return new ApiError(status, message);
}

export async function searchRepos(
  params: SearchParams,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  let response: Response;
  try {
    response = await fetch(buildSearchUrl(params), {
      signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  } catch (error) {
    // Cancellation is expected (the user moved on); let TanStack Query handle it silently.
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new NetworkError();
  }

  if (!response.ok) throw await toApiError(response);

  return (await response.json()) as SearchResponse;
}
