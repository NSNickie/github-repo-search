import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { API_URL } from '../api/github';
import type { Repo, SearchResponse } from '../api/types';

export function makeRepo(id: number, overrides: Partial<Repo> = {}): Repo {
  return {
    id,
    full_name: `owner${id}/repo-${id}`,
    html_url: `https://github.com/owner${id}/repo-${id}`,
    description: `Description for repo ${id}`,
    stargazers_count: 1000 + id,
    forks_count: 100 + id,
    language: 'TypeScript',
    updated_at: '2026-01-01T00:00:00Z',
    owner: { login: `owner${id}`, avatar_url: `https://avatars.example.test/u/${id}` },
    ...overrides,
  };
}

/** A fake search endpoint: `total` matching repos, served 30 per page like the real API. */
export function searchHandler(total: number) {
  return http.get(API_URL, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const perPage = Number(url.searchParams.get('per_page') ?? '30');
    const start = (page - 1) * perPage;
    const count = Math.max(0, Math.min(perPage, Math.min(total, 1000) - start));
    const body: SearchResponse = {
      total_count: total,
      incomplete_results: false,
      items: Array.from({ length: count }, (_, index) => makeRepo(start + index + 1)),
    };
    return HttpResponse.json(body);
  });
}

export const server = setupServer(searchHandler(95));
