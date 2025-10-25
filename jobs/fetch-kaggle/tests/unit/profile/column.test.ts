import { describe, it, expect } from 'vitest';
import { summarizeColumn } from '../../../src/lib/profile/column.js';

describe('summarizeColumn', () => {
  it('should calculate null rate correctly', () => {
    const columnData = [
      'value1',
      'value2',
      null,
      'value3',
      null,
      null,
      'value4',
      'value5',
      'value6',
      'value7',
    ];

    const summary = summarizeColumn(columnData, 'test_column', 10);

    // 3 nulls out of 10 = 30% null rate
    expect(summary.null_count).toBe(3);
    expect(summary.null_rate).toBe(0.3);
  });

  it('should detect numeric columns and calculate min/max', () => {
    const columnData = [100, 200, 150, 300, 50, 250, 175];

    const summary = summarizeColumn(columnData, 'numeric_col', 7);

    expect(summary.dtype).toBe('numeric');
    expect(summary.min).toBe(50);
    expect(summary.max).toBe(300);
  });

  it('should detect string columns without min/max', () => {
    const columnData = ['apple', 'banana', 'cherry', 'date'];

    const summary = summarizeColumn(columnData, 'string_col', 4);

    expect(summary.dtype).toBe('string');
    expect(summary.min).toBeUndefined();
    expect(summary.max).toBeUndefined();
  });

  it('should extract up to 3 sample values', () => {
    const columnData = ['a', 'b', 'c', 'd', 'e'];

    const summary = summarizeColumn(columnData, 'sample_col', 5);

    expect(summary.sample_values.length).toBeLessThanOrEqual(3);
    expect(summary.sample_values).toContain('a');
  });

  it('should calculate unique count', () => {
    const columnData = ['a', 'b', 'a', 'c', 'b', 'a', 'd'];

    const summary = summarizeColumn(columnData, 'unique_col', 7);

    expect(summary.unique_count).toBe(4); // a, b, c, d
  });

  it('should handle datetime columns', () => {
    const columnData = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'];

    const summary = summarizeColumn(columnData, 'date_col', 4);

    // Should detect as either string or numeric depending on parsing
    expect(summary.name).toBe('date_col');
    expect(summary.null_count).toBe(0);
  });

  it('should handle mixed numeric and string (treat as string)', () => {
    const columnData = [100, 'not a number', 200, 300];

    const summary = summarizeColumn(columnData, 'mixed_col', 4);

    expect(summary.dtype).toBe('string');
  });

  it('should handle empty non-null values', () => {
    const columnData: unknown[] = [];

    const summary = summarizeColumn(columnData, 'empty_col', 0);

    expect(summary.name).toBe('empty_col');
    expect(summary.null_count).toBe(0);
    expect(summary.unique_count).toBe(0);
  });

  it('should handle all null values', () => {
    const columnData = [null, null, null, null, null];

    const summary = summarizeColumn(columnData, 'all_null_col', 5);

    expect(summary.null_count).toBe(5);
    expect(summary.null_rate).toBe(1.0);
  });

  it('should detect numeric with decimals', () => {
    const columnData = [1.5, 2.7, 3.2, 4.9, 5.1];

    const summary = summarizeColumn(columnData, 'decimal_col', 5);

    expect(summary.dtype).toBe('numeric');
    expect(summary.min).toBe(1.5);
    expect(summary.max).toBe(5.1);
  });
});
