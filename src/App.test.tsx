import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import App from './App';
import { API_URL } from './api/github';
import { searchHandler, server } from './test/server';

function renderApp(path = '/') {
  window.history.replaceState(null, '', path);
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

const searchParam = (name: string) => new URLSearchParams(window.location.search).get(name);

describe('App', () => {
  it('starts idle and searches only when the form is submitted', async () => {
    let requests = 0;
    server.use(
      http.get(API_URL, () => {
        requests += 1;
        return HttpResponse.json({ total_count: 1, incomplete_results: false, items: [] });
      }),
    );
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByText('Find your next favourite repository')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toBeDisabled();

    await user.type(screen.getByRole('searchbox'), 'react');
    expect(requests).toBe(0);

    await user.keyboard('{Enter}');
    await waitFor(() => expect(requests).toBe(1));
    expect(searchParam('q')).toBe('react');
  });

  it('renders results and pages through them via the URL', async () => {
    const user = userEvent.setup();
    renderApp('/?q=react');

    expect(await screen.findByRole('heading', { name: '95 repositories' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /owner1\/repo-1/ })).toHaveAttribute(
      'href',
      'https://github.com/owner1/repo-1',
    );

    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(within(nav).getByRole('button', { name: 'Next page' }));

    expect(await screen.findByText('Page 2 of 4')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /owner31\/repo-31/ })).toBeInTheDocument();
    expect(searchParam('page')).toBe('2');
  });

  it('resets to page 1 when a filter changes', async () => {
    const user = userEvent.setup();
    renderApp('/?q=react&page=3');
    await screen.findByText('Page 3 of 4');

    await user.selectOptions(screen.getByLabelText('Sort'), 'stars');

    await waitFor(() => expect(searchParam('page')).toBeNull());
    expect(searchParam('sort')).toBe('stars');
  });

  it('corrects a page beyond the last one', async () => {
    renderApp('/?q=react&page=30');
    expect(await screen.findByText('Page 4 of 4')).toBeInTheDocument();
    expect(searchParam('page')).toBe('4');
  });

  it('caps pagination at 1,000 results and says so', async () => {
    server.use(searchHandler(312_450));
    renderApp('/?q=react');

    expect(
      await screen.findByRole('heading', { name: '312,450 repositories' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 34')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 34' })).toBeInTheDocument();
    expect(screen.getByText(/Only the first 1,000 results/)).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    server.use(searchHandler(0));
    renderApp('/?q=zzzz-nothing');
    expect(await screen.findByText('No repositories found')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('shows a countdown when rate limited', async () => {
    const reset = Math.floor(Date.now() / 1000) + 42;
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json(
          { message: 'API rate limit exceeded' },
          {
            status: 403,
            headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) },
          },
        ),
      ),
    );
    renderApp('/?q=react');

    expect(await screen.findByText('Rate limit reached')).toBeInTheDocument();
    expect(screen.getByText(/^\d+s$/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('shows the GitHub message for an invalid query', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json(
          {
            message: 'Validation Failed',
            errors: [{ message: 'The search is longer than 256 characters.' }],
          },
          { status: 422 },
        ),
      ),
    );
    renderApp('/?q=bad');

    expect(await screen.findByText('Invalid search query')).toBeInTheDocument();
    expect(screen.getByText(/longer than 256 characters/)).toBeInTheDocument();
  });

  it('offers a retry after a network error', async () => {
    let attempts = 0;
    server.use(
      http.get(API_URL, () => {
        attempts += 1;
        return attempts <= 2
          ? HttpResponse.error()
          : HttpResponse.json({ total_count: 1, incomplete_results: false, items: [] });
      }),
    );
    const user = userEvent.setup();
    renderApp('/?q=react');

    // One automatic retry happens first (TanStack Query waits ~1s before it).
    expect(await screen.findByText('Network error', {}, { timeout: 3000 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: '1 repository' })).toBeInTheDocument();
  });
});
