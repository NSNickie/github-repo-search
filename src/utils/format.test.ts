import { describe, expect, it } from 'vitest';
import { formatCompact, formatNumber, formatRelativeTime } from './format';

describe('formatCompact', () => {
  it('abbreviates large numbers', () => {
    expect(formatCompact(950)).toBe('950');
    expect(formatCompact(12_345)).toBe('12.3K');
    expect(formatCompact(2_100_000)).toBe('2.1M');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(312_450)).toBe('312,450');
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');

  it('formats past dates relative to now', () => {
    expect(formatRelativeTime('2026-10-20T11:59:30Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-10-20T09:00:00Z', now)).toBe('3 hours ago');
    expect(formatRelativeTime('2026-10-19T12:00:00Z', now)).toBe('yesterday');
    expect(formatRelativeTime('2026-10-17T12:00:00Z', now)).toBe('3 days ago');
    expect(formatRelativeTime('2024-10-20T12:00:00Z', now)).toBe('2 years ago');
  });

  it('returns an empty string for invalid dates', () => {
    expect(formatRelativeTime('not a date', now)).toBe('');
  });
});
