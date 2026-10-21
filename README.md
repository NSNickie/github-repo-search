# GitHub Repo Search

A small React + TypeScript app for searching public GitHub repositories, built on the
[GitHub REST search API](https://docs.github.com/en/rest/search/search#search-repositories).

**Live demo:** https://&lt;your-username&gt;.github.io/github-repo-search/

<!-- Add a screenshot: docs/screenshot.png -->

## Features

- **Search** by keyword. GitHub qualifiers work too, e.g. `react stars:>1000 topic:hooks`.
- **Sort** by best match, stars, forks or last update, ascending or descending.
- **Filter** by language.
- **Pagination** with first/last pages, an ellipsis window around the current page, and
  disabled Prev/Next at the edges.
- **Shareable URLs**: every search lives in the query string (`?q=react&sort=stars&page=3`), so
  refresh, Back/Forward and copy-pasted links all work.
- **Clear states** for first load (skeleton), page changes (previous page stays visible),
  no results, incomplete results, invalid queries, network errors and rate limiting (with a
  live countdown until the quota resets).
- Responsive layout, automatic dark mode, keyboard and screen-reader friendly.

## Getting started

Requires Node.js 22.22+ (pinned to 24 via [Volta](https://volta.sh) in `package.json`).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                            | What it does                            |
| --------------------------------- | --------------------------------------- |
| `npm run dev`                     | Start the Vite dev server               |
| `npm test`                        | Run unit and integration tests (Vitest) |
| `npm run lint`                    | ESLint                                  |
| `npm run typecheck`               | TypeScript (strict)                     |
| `npm run build`                   | Type-check and build to `dist/`         |
| `npm run format` / `format:check` | Prettier                                |

Every push to `main` runs the same checks in GitHub Actions and deploys `dist/` to GitHub Pages.

## How it works

```
URL query string ──► useSearchParamsState ──► useRepoSearch (TanStack Query) ──► GitHub API
      ▲                                                                              │
      └──────────── user actions only write to the URL ◄── results / errors ◄────────┘
```

- **The URL is the single source of truth.** Components never keep their own copy of the page
  or filters; they read and write the query string through `useSyncExternalStore` and the
  History API. Malformed values (`?page=abc`, `?sort=hot`) fall back to defaults, and fixes are
  applied with `replaceState` so they don't pollute history.
- **TanStack Query** handles caching, request cancellation and loading states. The query key
  is the full set of search params, so changing any of them fetches new data, and going back to
  a page you've already seen is instant.

```
src/
  api/          request + typed errors (RateLimitError, ValidationError, NetworkError)
  hooks/        URL state, search query, countdown, media query
  utils/        pagination maths, URL parsing, formatting, language list
  components/   SearchBar, Filters, RepoList, RepoCard, Pagination, StatusMessage, Skeleton
  test/         MSW mock server + test setup
```

## Design decisions

**Search on submit, not on every keystroke.** Unauthenticated search is limited to
**10 requests per minute**. Even with debouncing, search-as-you-type can burn two or three
requests per word, so the app only searches when you press Enter or click Search.

**Spend the quota carefully.** Results are cached for 5 minutes, the query is not refetched on
window focus, and the next page is not prefetched. Rate-limit and validation errors are not
retried automatically because retrying cannot succeed and would only use more quota; network
errors are retried once.

**Respect the 1,000-result ceiling.** GitHub returns at most the first 1,000 results of any
search, even when `total_count` is in the millions (page 35 at 30 per page returns HTTP 422). The
page count is computed from `min(total_count, 1000)`, the UI says so when the cap applies, and
an out-of-range `?page=` is clamped instead of producing an error.

**No access token.** Anything bundled into a static front end is public, so shipping a token
would leak it. The trade-off is the anonymous rate limit above, which the UI handles with a
countdown and a retry button. A backend proxy holding a token would raise the limit to 30/min.

**Plain CSS.** Styles are hand-written CSS Modules on top of a small set of CSS custom
properties (`src/styles/global.css`), which also makes dark mode a single override block.

## Testing

- Unit tests cover the logic that is easy to get subtly wrong: page-number windows, page
  clamping, URL parsing/serialization, error classification and formatting.
- Integration tests render the whole app against a [Mock Service Worker](https://mswjs.io)
  server: submitting a search, paging via the URL, filter changes resetting the page, clamping
  an out-of-range page, the 1,000-result cap, empty results, rate limiting, invalid queries and
  network-error retry. No test talks to the real API.

## Known limitations

- 10 searches per minute without authentication (see above).
- At most 1,000 results per search; narrow the query to dig deeper.
- GitHub occasionally times out on complex queries and returns partial results; the app shows a
  notice when `incomplete_results` is `true`.
