const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en-US');
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** 950 → "950", 12_345 → "12.3K", 2_100_000 → "2.1M" */
export function formatCompact(value: number): string {
  return compact.format(value);
}

/** 312450 → "312,450" */
export function formatNumber(value: number): string {
  return full.format(value);
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

/** ISO date → "3 days ago", "last month", "just now". */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  if (Number.isNaN(seconds)) return '';
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}
