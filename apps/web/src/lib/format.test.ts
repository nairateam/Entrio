import { describe, it, expect } from 'vitest';
import { initials, last4, formatDuration } from './format';

describe('initials', () => {
  it('takes the first two name parts, uppercased', () => {
    expect(initials('Maria Garcia')).toBe('MG');
    expect(initials('ada lovelace')).toBe('AL');
  });

  it('handles single names', () => {
    expect(initials('Cher')).toBe('C');
  });
});

describe('last4', () => {
  it('returns the last four digits, ignoring formatting', () => {
    expect(last4('+1 555 0123')).toBe('0123');
  });

  it('falls back when there are no digits', () => {
    expect(last4('n/a')).toBe('????');
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    const start = '2026-06-24T10:00:00.000Z';
    const end = '2026-06-24T10:35:00.000Z';
    expect(formatDuration(start, end)).toBe('35m');
  });

  it('formats hours and minutes', () => {
    const start = '2026-06-24T10:00:00.000Z';
    const end = '2026-06-24T11:35:00.000Z';
    expect(formatDuration(start, end)).toBe('1h 35m');
  });

  it('returns an em dash for a null start', () => {
    expect(formatDuration(null)).toBe('—');
  });
});
