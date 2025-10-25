import { PatternInfo } from '../../core/domain/entities/inventory';

/**
 * Regular expression to match date patterns in filenames (YYYYMMDD format)
 */
const DATE_PATTERN = /\d{8}/;

/**
 * Regular expression to match the standard Kaggle dataset filename pattern:
 * {file_type}_file_{chain}_{YYYYMMDD}.csv
 */
const STANDARD_PATTERN = /^(.+?)_file_(.+?)_(\d{8})\.csv$/;

/**
 * Extracts pattern information from a filename.
 *
 * Identifies the chain, file type, and pattern template from Kaggle dataset filenames.
 * Handles the standard format: {file_type}_file_{chain}_{YYYYMMDD}.csv
 *
 * @param filename - The filename to analyze (e.g., "price_full_file_shufersal_20240101.csv")
 * @returns PatternInfo object containing chain, fileType, and pattern template
 *
 * @example
 * ```typescript
 * const info = extractPatternInfo('price_full_file_shufersal_20240101.csv');
 * // Returns:
 * // {
 * //   chain: 'shufersal',
 * //   fileType: 'price_full',
 * //   pattern: 'price_full_file_shufersal_YYYYMMDD.csv'
 * // }
 * ```
 */
export function extractPatternInfo(filename: string): PatternInfo {
  // Try to match the standard pattern first
  const match = filename.match(STANDARD_PATTERN);

  if (match) {
    const [, fileType, chain] = match;

    return {
      chain,
      fileType,
      pattern: `${fileType}_file_${chain}_YYYYMMDD.csv`,
    };
  }

  // Fallback for unknown patterns
  // Try to detect if there's a date pattern we can replace
  if (DATE_PATTERN.test(filename)) {
    const pattern = filename.replace(DATE_PATTERN, 'YYYYMMDD');

    return {
      chain: 'unknown',
      fileType: 'unknown',
      pattern,
    };
  }

  // Complete fallback for files that don't match any known pattern
  return {
    chain: 'unknown',
    fileType: 'unknown',
    pattern: filename,
  };
}
