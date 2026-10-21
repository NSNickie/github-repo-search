# TRD: GitHub Repository Search

> Internal draft. Requirements live in `PRD.en.md`; this document only covers implementation.

## 1. Technology Choices

| Concern                 | Choice                                                             | Reason                                                                           |
| ----------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Language                | TypeScript (`strict: true`, `noUncheckedIndexedAccess`)            | Required; strict mode catches null/undefined bugs early                          |
| Framework               | React 19                                                           | Required                                                                         |
| Build                   | Vite                                                               | Fast startup, minimal configuration                                              |
| Data fetching & caching | TanStack Query v5                                                  | Caching, race-condition handling, loading states and retry policy out of the box |
| URL state               | Native `URLSearchParams` + a custom hook                           | Single page; a router library isn't needed                                       |
| Styling                 | CSS Modules + CSS custom properties                                | Hand-written CSS is required; custom properties make dark mode a single override |
| Testing                 | Vitest + React Testing Library + MSW                               | MSW mocks the GitHub API, so tests never spend real quota                        |
| Code quality            | ESLint + Prettier                                                  |                                                                                  |
| CI / deploy             | GitHub Actions → GitHub Pages                                      |                                                                                  |
| Runtime                 | Node 24, pinned with Volta; all dependency versions pinned exactly | Vitest 5 / jsdom require Node ≥ 22.12                                            |

## 2. Directory Structure

```
src/
  api/
    github.ts          // request builder, fetch wrapper, error classification
    errors.ts          // RateLimitError / ValidationError / NetworkError / ApiError
    types.ts           // response and search-param types
  hooks/
    useSearchParamsState.ts  // URL ↔ search params
    useRepoSearch.ts         // wraps useQuery
    useCountdown.ts          // rate-limit countdown
    useMediaQuery.ts         // narrow-screen detection for the page bar
  utils/
    pagination.ts      // getMaxPage / clampPage / getPageItems (pure functions)
    searchParams.ts    // parse / serialize URL query strings
    format.ts          // compact numbers, relative time
    languages.ts       // language list, query aliases, dot colours
  components/
    SearchBar/ Filters/ RepoList/ RepoCard/
    Pagination/ StatusMessage/ Skeleton/
  styles/
    global.css         // colour, spacing and radius variables, including dark mode
  test/
    setup.ts server.ts // MSW mock server and test setup
  App.tsx
  main.tsx
```

## 3. Data Flow

```
URL ?q=react&sort=stars&order=desc&lang=typescript&page=3
   │  useSearchParamsState: parse + validate + write back (pushState / popstate)
   ▼
SearchParams { q, sort, order, lang, page }
   │  useRepoSearch
   ▼
useQuery({ queryKey: ['repos', params], queryFn })
   │  served from cache when possible, otherwise fetched
   ▼
GitHub API  GET /search/repositories
```

The URL is the single source of truth. Components never keep their own copy of the page or filters; they only read and write the URL.

- Reading uses `useSyncExternalStore`, subscribed to `popstate` plus a custom event, because `pushState` / `replaceState` do not emit events on their own.
- Changing the sort, language or keyword also resets `page` to 1.
- Page changes and new searches use `pushState` (so Back works); corrections of invalid values use `replaceState` (no extra history entry, so Back doesn't bounce into a URL that immediately gets corrected again).
- Default values are omitted from the URL to keep shared links short.

## 4. API Calls

```
GET https://api.github.com/search/repositories
  q        = `${keyword}${lang ? ` language:${alias}` : ''}`
  sort     = stars | forks | updated     // omitted for Best match
  order    = desc | asc                  // only sent together with sort
  per_page = 30
  page     = 1..maxPage
Headers:
  Accept: application/vnd.github+json
  X-GitHub-Api-Version: 2022-11-28
```

- Parameters are built and encoded with `URLSearchParams`, never by string concatenation.
- Language names containing special characters use GitHub's aliases: `language:cpp` for C++ and `language:csharp` for C#. Both were verified against the live API.

Verified API behaviour (curl, before implementation):

- Anonymous search is limited to 10 requests per minute.
- Page 34 at 30 per page returns results; page 35 returns 422 "Only the first 1000 search results are available".
- Rate-limit headers (`x-ratelimit-*`, `retry-after`) are exposed via CORS, so the browser can read them.

Only the fields actually rendered are typed:

```ts
interface Repo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  owner: { login: string; avatar_url: string };
}

interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repo[];
}
```

## 5. Error Classification

| HTTP situation                                                                                | Class                    | Handling                                                                               |
| --------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| 429, or 403 with `x-ratelimit-remaining: 0` / a `retry-after` header / a "rate limit" message | `RateLimitError`         | Carries the time it's safe to retry; UI shows a countdown; never retried automatically |
| 422                                                                                           | `ValidationError`        | Shows GitHub's most specific message; not retried                                      |
| `fetch` throws (offline, DNS, CORS…)                                                          | `NetworkError`           | Retried automatically once                                                             |
| Any other non-2xx                                                                             | `ApiError` (with status) | Retried automatically once                                                             |
| Request aborted (`AbortError`)                                                                | Re-thrown unchanged      | Handled silently by TanStack Query                                                     |

A 403 is not automatically a rate limit (it can also be a permission error), so the classification checks the headers and message rather than the status code alone.

Retry time: prefer `retry-after` (seconds), otherwise `x-ratelimit-reset` (Unix timestamp), otherwise fall back to 60 seconds.

## 6. TanStack Query Configuration

Every option leans towards spending as little of the quota as possible.

```ts
useQuery({
  queryKey: ['repos', params],
  queryFn: ({ signal }) => searchRepos(params, signal), // stale requests are aborted when params change
  enabled: params.q !== '',
  staleTime: 5 * 60_000, // same query within 5 minutes is not refetched
  gcTime: 10 * 60_000,
  placeholderData: keepPreviousData, // keep the previous page visible while the next one loads
  retry: (count, err) =>
    !(err instanceof RateLimitError || err instanceof ValidationError) && count < 1,
  refetchOnWindowFocus: false, // don't refetch when the tab regains focus
});
```

UI state mapping:

| UI                                 | Condition                          |
| ---------------------------------- | ---------------------------------- |
| Skeleton                           | `isPending` with no data           |
| Faded previous list + progress bar | `isPlaceholderData` / `isFetching` |
| Error panel                        | `error`, rendered per error class  |

The next page is not prefetched: each prefetch costs one request, which isn't worth it under a 10-per-minute limit.

## 7. Pagination

```ts
const PER_PAGE = 30;
const MAX_RESULTS = 1000;

getMaxPage(total) = Math.max(1, Math.ceil(Math.min(total, MAX_RESULTS) / PER_PAGE));

// e.g. [1, 'start-ellipsis', 4, 5, 6, 7, 8, 'end-ellipsis', 34]
getPageItems(current, maxPage, siblings = 2): Array<number | 'start-ellipsis' | 'end-ellipsis'>;
```

- If an ellipsis would hide exactly one page, that page is shown instead (an ellipsis replacing one number saves no space).
- On narrow screens `siblings` drops to 1.
- Page validation: `clampPage(page, maxPage)`, which handles NaN, decimals and out-of-range values.
- Before `total_count` is known, the page is only clamped to the API ceiling (1–34); once it arrives, a page beyond the last one is corrected with `replaceState`.

## 8. Styling

- `global.css` defines CSS variables for colours, spacing, radii and fonts; `@media (prefers-color-scheme: dark)` overrides them for dark mode.
- One `*.module.css` per component.
- Breakpoint: 640px.
- Numbers use `font-variant-numeric: tabular-nums` so widths don't jump between pages.
- Descriptions are clamped to two lines with `-webkit-line-clamp: 2`.
- `prefers-reduced-motion` disables animations and smooth scrolling.

## 9. Accessibility

- Page bar wrapped in `<nav aria-label="Pagination">`; the current page has `aria-current="page"`.
- A visually hidden `aria-live="polite"` region announces loading and "Page X of Y".
- After a page change, focus moves to the results heading so keyboard and screen-reader users continue from the top of the list.
- Visible focus outlines on all interactive elements.

## 10. Security

- No GitHub token: anything bundled into a static front end is public.
- All text is rendered through React's default escaping; `dangerouslySetInnerHTML` is never used.
- External links use `target="_blank" rel="noopener noreferrer"`.

## 11. Testing

| Level                   | Coverage                                                                                                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                    | `getMaxPage`, `clampPage`, `getPageItems` (1 / 7 / 34 pages; current page at start, middle, end; single-page gaps); URL parsing and serialization; error classification; number and time formatting              |
| Integration (RTL + MSW) | Search only on submit; results and paging via the URL; filter change resets to page 1; out-of-range page corrected; 1,000-result cap; empty results; rate-limit countdown; 422 message; network error then retry |

No test talks to the real API.

## 12. CI / Deployment

GitHub Actions, triggered on push to `main` (checks also run on pull requests):

```
npm ci → format:check → lint → test → build (tsc -b && vite build) → deploy to Pages
```

Vite's `base` is set to `/github-repo-search/` for production builds to match the Pages sub-path.

## 13. Implementation Order (one commit per step)

1. Scaffolding: Vite + TypeScript + ESLint / Prettier
2. API layer: types + error classification + unit tests
3. Pagination utilities + unit tests
4. URL state hook + TanStack Query integration
5. Components: search, filters, list, card, pagination, status messages
6. Styling: variables, dark mode, responsive layout
7. Integration tests
8. CI + Pages deployment
9. README
