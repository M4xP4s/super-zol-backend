/**
 * File family detection utilities for schema profiling.
 * Identifies the family and chain from Kaggle dataset filenames.
 */

/**
 * Regular expression to match the standard Kaggle dataset filename pattern:
 * {file_type}_file_{chain}_{YYYYMMDD}.csv
 *
 * Examples:
 * - price_full_file_shufersal_20240101.csv
 * - promo_file_rami_20240101.csv
 * - store_file_teva_20240101.csv
 * - price_full_extra_file_chain_name_20240101.csv
 */
const STANDARD_PATTERN = /^(.+?)_file_(.+?)_(\d{8})\.csv$/;

/**
 * Detects the file family and chain from a filename.
 *
 * Parses Kaggle dataset filenames to extract:
 * - Family: The file type (e.g., "price_full", "promo", "store")
 * - Chain: The retail chain name (e.g., "shufersal", "rami", "teva")
 *
 * Uses the standard pattern: {file_type}_file_{chain}_{YYYYMMDD}.csv
 *
 * @param filename - The filename to analyze (e.g., "price_full_file_shufersal_20240101.csv")
 * @returns A tuple [family, chain] where both are strings. Returns ["unknown", "unknown"] if pattern doesn't match.
 *
 * @example
 * ```typescript
 * const [family, chain] = detectFileFamily('price_full_file_shufersal_20240101.csv');
 * // Returns: ["price_full", "shufersal"]
 * ```
 */
export function detectFileFamily(filename: string): [string, string] {
  const match = filename.match(STANDARD_PATTERN);

  if (!match) {
    return ['unknown', 'unknown'];
  }

  const [, family, chain] = match;

  // Defensive check: regex guarantees these are defined, but TypeScript needs verification
  if (!family || !chain) {
    return ['unknown', 'unknown'];
  }

  return [family, chain];
}
