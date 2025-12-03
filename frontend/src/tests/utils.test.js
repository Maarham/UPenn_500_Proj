import {
  getApiUrl,
  isWithinSFBounds,
  parseDateSafely,
  formatDisplayDate,
  getSourceLabel,
  createInitialFilters,
  SOURCE_OPTIONS,
  SF_BOUNDS,
} from '../utils';

describe('Utils Functions', () => {
  test('getApiUrl concatenates path correctly', () => {
    const result = getApiUrl('/api/test');
    expect(result).toContain('/api/test');
  });

  test('isWithinSFBounds returns true for SF coordinates', () => {
    expect(isWithinSFBounds(37.7749, -122.4194)).toBe(true);
  });

  test('isWithinSFBounds returns false for coordinates outside SF', () => {
    expect(isWithinSFBounds(37.9, -122.4194)).toBe(false);
  });

  test('parseDateSafely handles valid date', () => {
    const result = parseDateSafely('2024-01-01');
    expect(result).toBeInstanceOf(Date);
  });

  test('parseDateSafely returns null for invalid input', () => {
    expect(parseDateSafely(null)).toBeNull();
    expect(parseDateSafely('invalid')).toBeNull();
  });

  test('formatDisplayDate formats date correctly', () => {
    const date = new Date('2024-01-15T12:30:00');
    const result = formatDisplayDate(date);
    expect(result).toContain('2024');
  });

  test('getSourceLabel returns correct label', () => {
    expect(getSourceLabel('sfpd_incidents')).toBe('SFPD Incidents');
  });

  test('getSourceLabel returns value if not found', () => {
    expect(getSourceLabel('unknown')).toBe('unknown');
  });

  test('createInitialFilters returns object with correct defaults', () => {
    const filters = createInitialFilters();
    expect(filters.limit).toBe(100000);
    expect(filters.category).toBe('All');
    expect(filters.sources).toHaveLength(6);
  });

  test('SOURCE_OPTIONS has all sources', () => {
    expect(SOURCE_OPTIONS).toHaveLength(6);
    expect(SOURCE_OPTIONS[0]).toHaveProperty('value');
    expect(SOURCE_OPTIONS[0]).toHaveProperty('label');
  });

  test('SF_BOUNDS has valid coordinates', () => {
    expect(SF_BOUNDS.north).toBeGreaterThan(SF_BOUNDS.south);
    expect(SF_BOUNDS.east).toBeGreaterThan(SF_BOUNDS.west);
  });
});
