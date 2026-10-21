import { describe, expect, it } from 'vitest';
import { ABSOLUTE_MAX_PAGE, clampPage, getMaxPage, getPageItems } from './pagination';

describe('getMaxPage', () => {
  it('returns at least one page', () => {
    expect(getMaxPage(0)).toBe(1);
    expect(getMaxPage(-5)).toBe(1);
  });

  it('rounds partial pages up', () => {
    expect(getMaxPage(30)).toBe(1);
    expect(getMaxPage(31)).toBe(2);
    expect(getMaxPage(95)).toBe(4);
  });

  it('caps at the 1,000 results GitHub can return', () => {
    expect(getMaxPage(1000)).toBe(34);
    expect(getMaxPage(7_338_005)).toBe(34);
    expect(ABSOLUTE_MAX_PAGE).toBe(34);
  });
});

describe('clampPage', () => {
  it('keeps pages within 1..maxPage', () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(-3, 10)).toBe(1);
    expect(clampPage(5, 10)).toBe(5);
    expect(clampPage(999, 10)).toBe(10);
  });

  it('handles non-integers and NaN', () => {
    expect(clampPage(2.7, 10)).toBe(2);
    expect(clampPage(Number.NaN, 10)).toBe(1);
  });
});

describe('getPageItems', () => {
  it('shows a single page', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
  });

  it('shows every page when they all fit', () => {
    expect(getPageItems(1, 2)).toEqual([1, 2]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses both sides around a middle page', () => {
    expect(getPageItems(17, 34)).toEqual([
      1,
      'start-ellipsis',
      15,
      16,
      17,
      18,
      19,
      'end-ellipsis',
      34,
    ]);
  });

  it('only collapses the far side near the start', () => {
    expect(getPageItems(1, 34)).toEqual([1, 2, 3, 'end-ellipsis', 34]);
    expect(getPageItems(4, 34)).toEqual([1, 2, 3, 4, 5, 6, 'end-ellipsis', 34]);
  });

  it('only collapses the far side near the end', () => {
    expect(getPageItems(34, 34)).toEqual([1, 'start-ellipsis', 32, 33, 34]);
    expect(getPageItems(31, 34)).toEqual([1, 'start-ellipsis', 29, 30, 31, 32, 33, 34]);
  });

  it('fills a one-page gap instead of showing an ellipsis', () => {
    // Page 2 would be the only hidden page, so show it.
    expect(getPageItems(5, 34)).toEqual([1, 2, 3, 4, 5, 6, 7, 'end-ellipsis', 34]);
    expect(getPageItems(30, 34)).toEqual([1, 'start-ellipsis', 28, 29, 30, 31, 32, 33, 34]);
  });

  it('respects a smaller sibling count', () => {
    expect(getPageItems(17, 34, 1)).toEqual([1, 'start-ellipsis', 16, 17, 18, 'end-ellipsis', 34]);
  });

  it('clamps an out-of-range current page', () => {
    expect(getPageItems(99, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});
