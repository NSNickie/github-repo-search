import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../utils/searchParams';
import { ApiError, RateLimitError, ValidationError } from './errors';
import { buildSearchUrl, toApiError } from './github';

describe('buildSearchUrl', () => {
  it('encodes the keyword and uses our page size', () => {
    const url = new URL(buildSearchUrl({ ...DEFAULT_PARAMS, q: 'react hooks' }));
    expect(url.searchParams.get('q')).toBe('react hooks');
    expect(url.searchParams.get('per_page')).toBe('30');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.has('sort')).toBe(false);
    expect(url.searchParams.has('order')).toBe(false);
  });

  it('adds sort, order and a language qualifier', () => {
    const url = new URL(
      buildSearchUrl({ q: 'json', sort: 'stars', order: 'asc', lang: 'cpp', page: 2 }),
    );
    expect(url.searchParams.get('q')).toBe('json language:cpp');
    expect(url.searchParams.get('sort')).toBe('stars');
    expect(url.searchParams.get('order')).toBe('asc');
    expect(url.searchParams.get('page')).toBe('2');
  });
});

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('toApiError', () => {
  const now = 1_000_000_000_000;

  it('detects the primary rate limit and uses x-ratelimit-reset', async () => {
    const reset = now / 1000 + 42;
    const error = await toApiError(
      jsonResponse(
        403,
        { message: 'API rate limit exceeded' },
        { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) },
      ),
      now,
    );
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).resetAt).toBe(reset * 1000);
  });

  it('prefers retry-after for secondary rate limits', async () => {
    const error = await toApiError(
      jsonResponse(
        403,
        { message: 'You have exceeded a secondary rate limit' },
        { 'retry-after': '30' },
      ),
      now,
    );
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).resetAt).toBe(now + 30_000);
  });

  it('treats 429 as a rate limit with a fallback wait', async () => {
    const error = await toApiError(jsonResponse(429, {}), now);
    expect((error as RateLimitError).resetAt).toBe(now + 60_000);
  });

  it('maps 422 to a validation error with the most specific message', async () => {
    const error = await toApiError(
      jsonResponse(422, { message: 'Validation Failed', errors: [{ message: 'Bad qualifier' }] }),
      now,
    );
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Bad qualifier');
  });

  it('does not mistake a permission 403 for a rate limit', async () => {
    const error = await toApiError(
      jsonResponse(403, { message: 'Forbidden' }, { 'x-ratelimit-remaining': '5' }),
      now,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
  });

  it('survives a non-JSON error body', async () => {
    const error = await toApiError(
      new Response('<html>', { status: 502, statusText: 'Bad Gateway' }),
      now,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Bad Gateway');
  });
});
