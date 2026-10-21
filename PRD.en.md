# PRD: GitHub Repository Search

> Internal draft. Technical design lives in `TRD.en.md`.

## 1. Background and Goals

This is a take-home assignment: build a small app for searching repositories on GitHub.

Hard requirements:

- Use GitHub's official search API
- Provide a custom visual design (it can be simple)
- Support pagination
- Publish the finished project on GitHub and submit the repository URL
- The hiring company's name must not appear anywhere in the code, comments or documentation

Goal: keep the feature set small and get every detail right, so a reviewer comes away thinking "this person thinks things through".

## 2. Users and Usage

| User | Scenario |
|---|---|
| Reviewer (primary user) | Opens the live link, tries a few searches, pages through results, deliberately pokes at edge cases (no results, last page, rapid repeated clicks), then reads the code |
| Developer | Looking for a kind of open-source project, e.g. "the most-starred TypeScript state management libraries" |

Typical flow:

```
Open the page → enter a keyword and submit → see the result list
             → change sort / language → results update, back to page 1
             → change page → click a repository → GitHub opens in a new tab
```

## 3. Scope

In scope:

1. Keyword search
2. Sorting
3. Filtering by programming language
4. Pagination
5. Result list
6. Clear messages for every non-happy-path situation
7. Search state kept in the URL (survives refresh, shareable, Back button works)
8. Works on both mobile and desktop, with dark mode

Out of scope:

- Sign-in, favourites, search history
- Repository detail page (clicking a result goes straight to GitHub)
- Searching code, users or issues
- Multiple UI languages (the UI is English only)

## 4. Functional Requirements

### 4.1 Search

- A search box and a "Search" button at the top of the page.
- A search runs only when the user presses Enter or clicks the button, never while typing.
  - Reason: GitHub allows only 10 anonymous searches per minute; search-as-you-type would use them up quickly (see 6.1).
- An empty or whitespace-only keyword cannot be submitted; the button is disabled.
- Leading and trailing whitespace is trimmed.
- On first visit (before any search), show a short explanation and 3–4 example keywords that run a search when clicked.

Acceptance criteria:

- [ ] Typing "react" and pressing Enter shows results
- [ ] Typing does not trigger a search
- [ ] An empty keyword cannot be submitted

### 4.2 Sorting

Options:

| Option | Meaning |
|---|---|
| Best match (default) | Relevance as determined by GitHub |
| Most stars | By star count |
| Most forks | By fork count |
| Recently updated | By last update time |

- For every option except Best match, the user can switch between descending (default) and ascending.
- Changing the sort returns to page 1.

### 4.3 Language Filter

- Dropdown: Any (default, no filter), TypeScript, JavaScript, Python, Go, Rust, Java, C++, C#, PHP, Ruby, Swift, Kotlin.
- Changing the language returns to page 1.

### 4.4 Pagination (key requirement)

Rules:

- 30 results per page.
- GitHub returns at most the first 1,000 results of any search, so at most 34 pages are reachable, even when the reported total is in the hundreds of thousands.
- When the total exceeds 1,000:
  - Show the real total, e.g. "312,450 repositories"
  - Below the page bar, show "Only the first 1,000 results are available"

The page bar looks like this:

```
‹ Prev   1  …  4  5  [6]  7  8  …  34   Next ›
```

- The first and last pages are always shown, plus 2 pages on each side of the current page; the rest collapse into "…".
- The current page is highlighted and not clickable.
- "Prev" is disabled on the first page; "Next" is disabled on the last page.
- The page bar is hidden when there is only one page.
- After a page change, the view scrolls back to the top of the list.
- An invalid page in the URL (not a number, below 1, beyond the last page) is automatically corrected to the nearest valid page.

Acceptance criteria:

- [ ] Searching "react" can reach page 34, where "Next" is disabled
- [ ] With only 2 pages of results, the bar shows just 1 and 2
- [ ] Manually editing the URL to `page=999` lands on the last page
- [ ] No blank flash while changing pages

### 4.5 Result Display

Each result is a card containing:

| Content | Details |
|---|---|
| Owner avatar | Small circle |
| Full repository name | `owner/repo`; clicking opens GitHub in a new tab |
| Description | At most 2 lines, truncated with an ellipsis; the line is omitted when there is no description |
| Star count | Large numbers abbreviated, e.g. `12.3k` |
| Fork count | Same as above |
| Primary language | With a small coloured dot; omitted when there is no language |
| Last updated | Relative time, e.g. "Updated 3 days ago" |

The total number of results is shown above the list.

### 4.6 Search State in the URL

- Keyword, sort, language and page are all stored in the URL, e.g. `?q=react&sort=stars&lang=typescript&page=3`.
- Refreshing the page shows the same results.
- Someone opening a shared link sees the same results.
- The browser Back button returns to the previous page or the previous search.

### 4.7 States and Messages

| Situation | What the user sees |
|---|---|
| No search yet | Explanation text + example keywords |
| First search loading | Grey placeholder cards (skeleton) |
| Changing page | The previous page stays visible, slightly faded, with a thin progress bar at the top |
| No results | "No repositories found" + a suggestion to change keywords or remove the language filter |
| Results may be incomplete | Yellow notice: the GitHub search timed out and some results may be missing |
| Search quota used up | "Rate limit reached. Try again in 42s" with a live countdown; a "Retry" button appears at 0 |
| Invalid query | "Invalid search query" + a hint on how to fix it |
| Network error | Error explanation + "Retry" button |

Acceptance criteria:

- [ ] Every situation shows a clear message; the page is never blank or stuck

## 5. UI and Experience

- Style: clean and close to GitHub's own look and feel.
- Layout: search area at the top, filter bar in the middle, result list and page bar below; on desktop the content is centred with a maximum width of about 880px.
- Mobile (below 640px wide): the filter bar wraps, card details stack vertically, and the page bar shows fewer pages around the current one.
- Dark mode: follows the system setting automatically.
- Accessibility:
  - Search, filtering and paging can all be done with the keyboard alone
  - Focused elements have a clearly visible outline
  - Text has sufficient contrast against its background
  - Screen readers announce the current page and loading state

## 6. Constraints and Risks

### 6.1 GitHub API Limits

| Limit | Impact on the product | Mitigation |
|---|---|---|
| At most 10 anonymous searches per minute | Fast paging or frequent searches get rate-limited | Search only on submit; don't re-request pages already seen; show a countdown when limited |
| At most 1,000 results per search | Pages beyond 34 are unreachable | Compute page count from 1,000 results and tell the user |
| Searches may time out with partial results | A few complex queries return fewer results | Show a notice |

### 6.2 No Sign-in

The app does not use GitHub account authorisation. Because the site is public, any key embedded in it would be visible to everyone. The trade-off is being limited to the anonymous quota, which the README explains.

## 7. Deliverables

1. A public GitHub repository
2. A live URL that can be opened and used directly
3. An English README: screenshot, live link, how to run locally, design trade-offs, known limitations
4. A clean commit history (one commit per feature step)

## 8. Open Questions

- [ ] GitHub account and repository name (suggested: `github-repo-search`)
- [ ] Fixed 30 results per page, or let the user choose 10 / 30 / 50
- [ ] Whether the language list needs additions or removals
