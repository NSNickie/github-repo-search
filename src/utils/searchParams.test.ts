import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, parseSearchParams, serializeSearchParams } from './searchParams';

describe('parseSearchParams', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseSearchParams('')).toEqual(DEFAULT_PARAMS);
  });

  it('reads valid values', () => {
    expect(parseSearchParams('?q=react&sort=stars&order=asc&lang=typescript&page=3')).toEqual({
      q: 'react',
      sort: 'stars',
      order: 'asc',
      lang: 'typescript',
      page: 3,
    });
  });

  it('falls back to defaults for unknown or malformed values', () => {
    expect(parseSearchParams('?q=%20react%20&sort=hot&order=up&lang=cobol&page=abc')).toEqual({
      ...DEFAULT_PARAMS,
      q: 'react',
    });
  });

  it('clamps the page to the range the API can serve', () => {
    expect(parseSearchParams('?q=a&page=0').page).toBe(1);
    expect(parseSearchParams('?q=a&page=999').page).toBe(34);
  });
});

describe('serializeSearchParams', () => {
  it('omits defaults', () => {
    expect(serializeSearchParams(DEFAULT_PARAMS)).toBe('');
    expect(serializeSearchParams({ ...DEFAULT_PARAMS, q: 'react' })).toBe('?q=react');
  });

  it('drops order when sorting by best match', () => {
    expect(serializeSearchParams({ ...DEFAULT_PARAMS, q: 'a', order: 'asc' })).toBe('?q=a');
  });

  it('round-trips through parse', () => {
    const params = {
      q: 'state management',
      sort: 'updated',
      order: 'asc',
      lang: 'cpp',
      page: 4,
    } as const;
    expect(parseSearchParams(serializeSearchParams(params))).toEqual(params);
  });
});
