/**
 * Column summarization utilities for schema profiling.
 * Analyzes individual columns and generates summary statistics.
 */

import type { ColumnSummary } from '../../core/domain/entities/profile.js';

/**
 * Determines the data type of a column by analyzing its values.
 *
 * @param values - Non-null values from the column
 * @returns 'numeric' if all non-null values are numbers, 'string' otherwise
 */
function detectDataType(values: unknown[]): 'numeric' | 'string' {
  if (values.length === 0) {
    return 'string';
  }

  for (const value of values) {
    // Check if all non-null values are numbers
    if (typeof value !== 'number') {
      return 'string';
    }
  }

  return 'numeric';
}

/**
 * Extracts sample values from the column (up to 3).
 *
 * @param values - All non-null values from the column
 * @returns Array of up to 3 sample values
 */
function extractSamples(values: unknown[]): unknown[] {
  return values.slice(0, 3);
}

/**
 * Calculates min and max for numeric columns.
 *
 * @param values - All non-null numeric values
 * @returns Object with min/max or undefined if not numeric
 */
function calculateMinMax(
  values: unknown[],
  dtype: 'numeric' | 'string'
): { min?: number | string; max?: number | string } {
  if (dtype !== 'numeric' || values.length === 0) {
    return {};
  }

  let min = Infinity;
  let max = -Infinity;

  for (const value of values) {
    if (typeof value === 'number') {
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    }
  }

  return {
    min: min === Infinity ? undefined : min,
    max: max === -Infinity ? undefined : max,
  };
}

/**
 * Summarizes a column with statistics: null rate, unique count, data type, samples.
 *
 * Analyzes a column from a CSV file and generates:
 * - Null count and null rate
 * - Unique value count
 * - Data type detection (numeric vs string)
 * - Sample values (up to 3)
 * - Min/max for numeric columns
 *
 * @param columnData - Array of values from the column (including nulls)
 * @param columnName - Name of the column
 * @param totalRows - Total number of rows in the dataset
 * @returns ColumnSummary object with all statistics
 *
 * @example
 * ```typescript
 * const data = [100, 200, null, 300, 150];
 * const summary = summarizeColumn(data, 'price', 5);
 * // Returns:
 * // {
 * //   name: 'price',
 * //   dtype: 'numeric',
 * //   null_count: 1,
 * //   null_rate: 0.2,
 * //   unique_count: 4,
 * //   sample_values: [100, 200, 300],
 * //   min: 100,
 * //   max: 300
 * // }
 * ```
 */
export function summarizeColumn(
  columnData: unknown[],
  columnName: string,
  totalRows: number
): ColumnSummary {
  // Count nulls
  let nullCount = 0;
  const nonNullValues: unknown[] = [];

  for (const value of columnData) {
    if (value === null || value === undefined || value === '') {
      nullCount++;
    } else {
      nonNullValues.push(value);
    }
  }

  // Detect data type
  const dtype = detectDataType(nonNullValues);

  // Calculate unique count
  const uniqueSet = new Set<string>();
  for (const value of nonNullValues) {
    uniqueSet.add(String(value));
  }
  const uniqueCount = uniqueSet.size;

  // Calculate min/max
  const minMax = calculateMinMax(nonNullValues, dtype);

  // Extract samples
  const sampleValues = extractSamples(nonNullValues);

  // Calculate null rate (use totalRows for accurate rate)
  const nullRate = totalRows > 0 ? nullCount / totalRows : 0;

  return {
    name: columnName,
    dtype,
    null_count: nullCount,
    null_rate: nullRate,
    unique_count: uniqueCount,
    sample_values: sampleValues,
    ...minMax,
  };
}
